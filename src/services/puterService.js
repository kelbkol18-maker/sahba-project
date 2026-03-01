/**
 * ═══════════════════════════════════════════════════════════════
 *  صُحبة — Puter.js Service Layer
 *  Central module for all Puter.js interactions:
 *  Auth, Key-Value Database, File Storage
 * ═══════════════════════════════════════════════════════════════
 */

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getPuter = () => {
    if (!window.puter) {
        throw new Error('Puter.js SDK not loaded. Make sure the script is included in index.html');
    }
    return window.puter;
};

/** Generate a unique ID (timestamp + random) */
const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
};

// ─── AUTH SERVICE ─────────────────────────────────────────────────────────────

export const authService = {
    /**
     * Sign in via Puter popup (must be triggered by user action)
     * @returns {Promise<object>} user info
     */
    async signIn() {
        const puter = getPuter();
        await puter.auth.signIn();
        const user = await puter.auth.getUser();
        // Save/update user profile in our KV on first login
        await userService.upsertProfile({
            id: user.username,
            username: user.username,
            displayName: user.username,
            bio: '',
            avatar: null,
            channelId: null,
            joinedAt: new Date().toISOString(),
        });
        return user;
    },

    /**
     * Get current Puter user (null if not signed in)
     */
    async getUser() {
        try {
            const puter = getPuter();
            const user = await puter.auth.getUser();
            return user;
        } catch {
            return null;
        }
    },

    /** Check if user is authenticated with Puter (not guest) */
    async isAuthenticated() {
        const user = await this.getUser();
        return !!user && !!user.username;
    },
};

// ─── KV HELPERS (generic) ─────────────────────────────────────────────────────

const kv = {
    async set(key, value) {
        const puter = getPuter();
        await puter.kv.set(key, JSON.stringify(value));
    },

    async get(key) {
        const puter = getPuter();
        const raw = await puter.kv.get(key);
        if (!raw) return null;
        try {
            return JSON.parse(raw);
        } catch {
            return raw;
        }
    },

    async del(key) {
        const puter = getPuter();
        await puter.kv.del(key);
    },

    /**
     * Get a list stored at a key. Always returns an array.
     */
    async getList(key) {
        const data = await this.get(key);
        return Array.isArray(data) ? data : [];
    },

    /**
     * Push an item to a list stored at a key (max items optional).
     */
    async pushToList(key, item, maxItems = 500) {
        const list = await this.getList(key);
        list.unshift(item); // newest first
        if (list.length > maxItems) list.length = maxItems;
        await this.set(key, list);
        return list;
    },

    /**
     * Remove an item from a list by predicate
     */
    async removeFromList(key, predicate) {
        const list = await this.getList(key);
        const filtered = list.filter((item) => !predicate(item));
        await this.set(key, filtered);
        return filtered;
    },
};

// ─── USER SERVICE ─────────────────────────────────────────────────────────────

export const userService = {
    _key(userId) {
        return `user:${userId}`;
    },

    /** Create or update user profile */
    async upsertProfile(profile) {
        const existing = await this.getProfile(profile.id);
        const merged = existing
            ? { ...existing, ...profile, joinedAt: existing.joinedAt }
            : profile;
        await kv.set(this._key(profile.id), merged);
        return merged;
    },

    /** Get user profile by ID */
    async getProfile(userId) {
        return await kv.get(this._key(userId));
    },

    /** Update specific fields */
    async updateProfile(userId, updates) {
        const profile = await this.getProfile(userId);
        if (!profile) throw new Error('User not found');
        const updated = { ...profile, ...updates };
        await kv.set(this._key(userId), updated);
        return updated;
    },
};

// ─── CHANNEL SERVICE ──────────────────────────────────────────────────────────

export const channelService = {
    _key(channelId) {
        return `channel:${channelId}`;
    },
    _userChannelKey(userId) {
        return `user_channel:${userId}`;
    },
    _indexKey() {
        return `channels:index`;
    },

    /** Create a new channel */
    async create({ ownerId, name, description, avatar }) {
        // Check if user already has a channel
        const existing = await this.getByOwner(ownerId);
        if (existing) throw new Error('لديك قناة بالفعل. يمكنك إنشاء قناة واحدة فقط.');

        const channelId = generateId();
        const channel = {
            id: channelId,
            ownerId,
            name,
            description: description || '',
            avatar: avatar || null,
            followersCount: 0,
            videosCount: 0,
            shortsCount: 0,
            createdAt: new Date().toISOString(),
        };

        await kv.set(this._key(channelId), channel);
        // Map user → channel
        await kv.set(this._userChannelKey(ownerId), channelId);
        // Add to global channel index
        await kv.pushToList(this._indexKey(), { id: channelId, name, ownerId });
        // Update user profile
        await userService.updateProfile(ownerId, { channelId });

        return channel;
    },

    /** Get channel by ID */
    async getById(channelId) {
        return await kv.get(this._key(channelId));
    },

    /** Get channel by owner user ID */
    async getByOwner(userId) {
        const channelId = await kv.get(this._userChannelKey(userId));
        if (!channelId) return null;
        return await this.getById(channelId);
    },

    /** Update channel info */
    async update(channelId, updates) {
        const channel = await this.getById(channelId);
        if (!channel) throw new Error('القناة غير موجودة');
        const updated = { ...channel, ...updates };
        await kv.set(this._key(channelId), updated);
        return updated;
    },

    /** Get all channels (from index) */
    async listAll() {
        return await kv.getList(this._indexKey());
    },

    /** Increment a counter (videosCount, shortsCount, followersCount) */
    async incrementCounter(channelId, field, delta = 1) {
        const channel = await this.getById(channelId);
        if (!channel) return;
        channel[field] = (channel[field] || 0) + delta;
        await kv.set(this._key(channelId), channel);
        return channel;
    },
};

// ─── POST SERVICE ─────────────────────────────────────────────────────────────

export const postService = {
    _key(postId) {
        return `post:${postId}`;
    },
    _feedKey() {
        return `feed:posts`;
    },
    _userPostsKey(userId) {
        return `user_posts:${userId}`;
    },

    /** Create a new text post (optionally with image URL) */
    async create({ authorId, authorName, content, imageUrl }) {
        // --- MODERATION CHECK ---
        let status = 'published';
        if (imageUrl) {
            const publicUrl = await storageService.getPublicUrl(imageUrl);
            const aiStatus = await moderationService.checkMediaAndText(content, publicUrl);
            if (aiStatus === 'rejected') throw new Error('تم رفض المحتوى لمخالفته الشريعة أو سياسة التطبيق.');
        } else {
            const aiStatus = await moderationService.checkText(content);
            if (aiStatus === 'rejected') throw new Error('تم رفض المحتوى النصي لاحتوائه على كلمات غير لائقة.');
        }
        // ------------------------

        const postId = generateId();
        const post = {
            id: postId,
            authorId,
            authorName,
            content,
            imageUrl: imageUrl || null,
            likes: 0,
            comments: 0,
            likedBy: [],
            status: 'published', // will be 'pending' once moderation is added
            createdAt: new Date().toISOString(),
        };

        await kv.set(this._key(postId), post);
        // Add to global feed
        await kv.pushToList(this._feedKey(), postId);
        // Add to user's posts
        await kv.pushToList(this._userPostsKey(authorId), postId);
        return post;
    },

    /** Get a single post */
    async getById(postId) {
        return await kv.get(this._key(postId));
    },

    /** Get feed (list of full post objects, newest first) */
    async getFeed(limit = 20) {
        const ids = await kv.getList(this._feedKey());
        const sliced = ids.slice(0, limit);
        const posts = await Promise.all(sliced.map((id) => this.getById(id)));
        return posts.filter(Boolean); // remove nulls
    },

    /** Get posts by a specific user */
    async getByUser(userId, limit = 20) {
        const ids = await kv.getList(this._userPostsKey(userId));
        const sliced = ids.slice(0, limit);
        const posts = await Promise.all(sliced.map((id) => this.getById(id)));
        return posts.filter(Boolean);
    },

    /** Delete a post */
    async remove(postId, authorId) {
        await kv.del(this._key(postId));
        await kv.removeFromList(this._feedKey(), (id) => id === postId);
        await kv.removeFromList(this._userPostsKey(authorId), (id) => id === postId);
    },

    /** Toggle like */
    async toggleLike(postId, userId) {
        const post = await this.getById(postId);
        if (!post) return null;
        const likedBy = post.likedBy || [];
        const alreadyLiked = likedBy.includes(userId);
        if (alreadyLiked) {
            post.likedBy = likedBy.filter((id) => id !== userId);
            post.likes = Math.max(0, post.likes - 1);
        } else {
            post.likedBy.push(userId);
            post.likes += 1;
        }
        await kv.set(this._key(postId), post);
        return { liked: !alreadyLiked, post };
    },

    /** Update post */
    async update(postId, updates) {
        const post = await this.getById(postId);
        if (!post) throw new Error('المنشور غير موجود');
        const updated = { ...post, ...updates };
        await kv.set(this._key(postId), updated);
        return updated;
    },
};

// ─── VIDEO SERVICE ────────────────────────────────────────────────────────────

export const videoService = {
    _key(videoId) {
        return `video:${videoId}`;
    },
    _feedKey() {
        return `feed:videos`;
    },
    _channelVideosKey(channelId) {
        return `channel_videos:${channelId}`;
    },

    /** Create a new video entry */
    async create({ channelId, authorId, authorName, title, description, videoUrl, thumbnailUrl }) {
        // --- MODERATION CHECK ---
        const combinedText = `${title}. ${description}`;
        const aiStatus = await moderationService.checkText(combinedText); // Video vision check is complex, checking title/desc for now
        if (aiStatus === 'rejected') throw new Error('تم رفض الفيديو بسبب العنوان أو الوصف المخالف.');
        // ------------------------

        const videoId = generateId();
        const video = {
            id: videoId,
            channelId,
            authorId,
            authorName,
            title,
            description: description || '',
            videoUrl,
            thumbnailUrl: thumbnailUrl || null,
            views: 0,
            likes: 0,
            comments: 0,
            likedBy: [],
            status: 'published',
            createdAt: new Date().toISOString(),
        };

        await kv.set(this._key(videoId), video);
        await kv.pushToList(this._feedKey(), videoId);
        await kv.pushToList(this._channelVideosKey(channelId), videoId);
        await channelService.incrementCounter(channelId, 'videosCount');
        return video;
    },

    async getById(videoId) {
        return await kv.get(this._key(videoId));
    },

    async getFeed(limit = 20) {
        const ids = await kv.getList(this._feedKey());
        const videos = await Promise.all(ids.slice(0, limit).map((id) => this.getById(id)));
        return videos.filter(Boolean);
    },

    async getByChannel(channelId, limit = 20) {
        const ids = await kv.getList(this._channelVideosKey(channelId));
        const videos = await Promise.all(ids.slice(0, limit).map((id) => this.getById(id)));
        return videos.filter(Boolean);
    },

    async toggleLike(videoId, userId) {
        const video = await this.getById(videoId);
        if (!video) return null;
        const likedBy = video.likedBy || [];
        const alreadyLiked = likedBy.includes(userId);
        if (alreadyLiked) {
            video.likedBy = likedBy.filter((id) => id !== userId);
            video.likes = Math.max(0, video.likes - 1);
        } else {
            video.likedBy.push(userId);
            video.likes += 1;
        }
        await kv.set(this._key(videoId), video);
        return { liked: !alreadyLiked, video };
    },

    async remove(videoId, channelId) {
        await kv.del(this._key(videoId));
        await kv.removeFromList(this._feedKey(), (id) => id === videoId);
        await kv.removeFromList(this._channelVideosKey(channelId), (id) => id === videoId);
        await channelService.incrementCounter(channelId, 'videosCount', -1);
    },
};

// ─── SHORTS SERVICE ───────────────────────────────────────────────────────────

export const shortsService = {
    _key(shortId) {
        return `short:${shortId}`;
    },
    _feedKey() {
        return `feed:shorts`;
    },
    _channelShortsKey(channelId) {
        return `channel_shorts:${channelId}`;
    },

    /** Create a new short */
    async create({ channelId, authorId, authorName, caption, videoUrl }) {
        // --- MODERATION CHECK ---
        const aiStatus = await moderationService.checkText(caption || '');
        if (aiStatus === 'rejected') throw new Error('تم رفض المقطع القصير لاحتواء الوصف على عبارات مخالفة.');
        // ------------------------

        const shortId = generateId();
        const short = {
            id: shortId,
            channelId,
            authorId,
            authorName,
            caption: caption || '',
            videoUrl,
            likes: 0,
            comments: 0,
            likedBy: [],
            status: 'published',
            createdAt: new Date().toISOString(),
        };

        await kv.set(this._key(shortId), short);
        await kv.pushToList(this._feedKey(), shortId);
        await kv.pushToList(this._channelShortsKey(channelId), shortId);
        await channelService.incrementCounter(channelId, 'shortsCount');
        return short;
    },

    async getById(shortId) {
        return await kv.get(this._key(shortId));
    },

    async getFeed(limit = 30) {
        const ids = await kv.getList(this._feedKey());
        const shorts = await Promise.all(ids.slice(0, limit).map((id) => this.getById(id)));
        return shorts.filter(Boolean);
    },

    async getByChannel(channelId, limit = 30) {
        const ids = await kv.getList(this._channelShortsKey(channelId));
        const shorts = await Promise.all(ids.slice(0, limit).map((id) => this.getById(id)));
        return shorts.filter(Boolean);
    },

    async toggleLike(shortId, userId) {
        const short = await this.getById(shortId);
        if (!short) return null;
        const likedBy = short.likedBy || [];
        const alreadyLiked = likedBy.includes(userId);
        if (alreadyLiked) {
            short.likedBy = likedBy.filter((id) => id !== userId);
            short.likes = Math.max(0, short.likes - 1);
        } else {
            short.likedBy.push(userId);
            short.likes += 1;
        }
        await kv.set(this._key(shortId), short);
        return { liked: !alreadyLiked, short };
    },

    async remove(shortId, channelId) {
        await kv.del(this._key(shortId));
        await kv.removeFromList(this._feedKey(), (id) => id === shortId);
        await kv.removeFromList(this._channelShortsKey(channelId), (id) => id === shortId);
        await channelService.incrementCounter(channelId, 'shortsCount', -1);
    },
};

// ─── FOLLOW SERVICE ───────────────────────────────────────────────────────────

export const followService = {
    _followingKey(userId) {
        return `following:${userId}`;
    },
    _followersKey(channelId) {
        return `followers:${channelId}`;
    },

    /** Toggle follow/unfollow a channel */
    async toggleFollow(userId, channelId) {
        const following = await kv.getList(this._followingKey(userId));
        const isFollowing = following.includes(channelId);

        if (isFollowing) {
            await kv.removeFromList(this._followingKey(userId), (id) => id === channelId);
            await kv.removeFromList(this._followersKey(channelId), (id) => id === userId);
            await channelService.incrementCounter(channelId, 'followersCount', -1);
        } else {
            await kv.pushToList(this._followingKey(userId), channelId);
            await kv.pushToList(this._followersKey(channelId), userId);
            await channelService.incrementCounter(channelId, 'followersCount', 1);
        }
        return { following: !isFollowing };
    },

    /** Check if user follows a channel */
    async isFollowing(userId, channelId) {
        const following = await kv.getList(this._followingKey(userId));
        return following.includes(channelId);
    },

    /** Get all channels a user follows */
    async getFollowing(userId) {
        return await kv.getList(this._followingKey(userId));
    },

    /** Get all followers of a channel */
    async getFollowers(channelId) {
        return await kv.getList(this._followersKey(channelId));
    },
};

// ─── COMMENT SERVICE ──────────────────────────────────────────────────────────

export const commentService = {
    _key(contentId) {
        return `comments:${contentId}`;
    },

    /** Add a comment to any content (post, video, short) */
    async add(contentId, { authorId, authorName, text }) {
        const commentId = generateId();
        const comment = {
            id: commentId,
            authorId,
            authorName,
            text,
            createdAt: new Date().toISOString(),
        };
        await kv.pushToList(this._key(contentId), comment);
        return comment;
    },

    /** Get all comments for a content */
    async getAll(contentId) {
        return await kv.getList(this._key(contentId));
    },

    /** Delete a comment */
    async remove(contentId, commentId) {
        await kv.removeFromList(this._key(contentId), (c) => c.id === commentId);
    },
};

// ─── BOOKMARK SERVICE ─────────────────────────────────────────────────────────

export const bookmarkService = {
    _key(userId) {
        return `bookmarks:${userId}`;
    },

    /** Add a bookmark */
    async add(userId, { contentId, contentType, title, thumbUrl }) {
        const bookmarks = await kv.getList(this._key(userId));
        const exists = bookmarks.find((b) => b.contentId === contentId);
        if (exists) return bookmarks;

        const newBookmark = {
            id: generateId(),
            contentId,
            contentType,
            title,
            thumbUrl,
            savedAt: new Date().toISOString()
        };

        return await kv.pushToList(this._key(userId), newBookmark);
    },

    /** Remove a bookmark */
    async remove(userId, contentId) {
        return await kv.removeFromList(this._key(userId), (b) => b.contentId === contentId);
    },

    /** Get all bookmarks */
    async getAll(userId) {
        return await kv.getList(this._key(userId));
    },
};

// ─── FILE STORAGE (via Puter.fs) ──────────────────────────────────────────────

export const storageService = {
    /**
     * Upload a file (image or video) to Puter cloud storage
     * @param {File|Blob} file - the file object
     * @param {string} folder - folder path, e.g. 'suhba/images'
     * @param {string} [customName] - optional filename
     * @returns {Promise<string>} the file path / URL
     */
    async uploadFile(file, folder = 'suhba/uploads', customName) {
        const puter = getPuter();
        const fileName = customName || `${generateId()}_${file.name || 'file'}`;
        const fullPath = `${folder}/${fileName}`;
        const result = await puter.fs.write(fullPath, file);
        return result;
    },

    /**
     * Read a file from Puter cloud storage
     */
    async readFile(path) {
        const puter = getPuter();
        return await puter.fs.read(path);
    },

    /**
     * Get a temporary public read URL for a file to send to AI
     */
    async getPublicUrl(path) {
        // Technically puter.fs has no getPublicUrl without hosting,
        // but Puter AI can sometimes read internally hosted blobs if passed directly.
        // For simplicity in this mock integration, we pass the URL path.
        return `https://api.puter.com/v2/fs/read/${path}`;
    }
};

// ─── MODERATION SERVICE (AI-Powered) ──────────────────────────────────────────

export const moderationService = {
    /**
     * AI Prompt to determine if content aligns with Islamic guidelines
     */
    _systemPrompt: `صفتك مشرف محتوى في منصة تواصل اجتماعي "إسلامية" محافظة. 
مهمتك تحليل النص أو الصورة المرفقة، والرد الدقيق بكلمة واحدة فقط:
"مقبول" (إذا كان المحتوى هادف وخالي من المحرمات) 
أو "مرفوض" (إذا كان المحتوى يحتوي على: ألفاظ نابية، سب، شتم، تبرج، عري، موسيقى صاخبة، دعوة للرذيلة، أو أي شيء يصنف "حرام" بشكل صريح).
الرد بكلمة واحدة فقط دون أي شرح إضافي.`,

    /** Check Text */
    async checkText(text) {
        try {
            const puter = getPuter();
            const response = await puter.ai.chat(`${this._systemPrompt}\n\nالنص المُراد فحصه:\n"${text}"`, { model: 'gpt-4o-mini' });
            const result = response?.message?.content?.trim() || 'مقبول';
            return result.includes('مرفوض') ? 'rejected' : 'approved';
        } catch (err) {
            console.error('Text moderation failed, defaulting to approved:', err);
            return 'approved'; // Fail open for now
        }
    },

    /** Check Image/Video */
    async checkMediaAndText(text, fileUrl) {
        try {
            const puter = getPuter();
            // Note: Puter AI vision takes an image URL or Blob.
            // Using a basic text prompt for now since we're passing it a URL.
            // In a real app, we'd pass the actual image Blob.
            const response = await puter.ai.chat(
                `${this._systemPrompt}\n\nالنص التوضيحي المرفق للملف:\n"${text}"\n\nقم بفحص الملف والنص.`,
                fileUrl,
                { model: 'gpt-4o' } // Needs vision capability
            );
            const result = response?.message?.content?.trim() || 'مقبول';
            return result.includes('مرفوض') ? 'rejected' : 'approved';
        } catch (err) {
            console.error('Media moderation failed, defaulting to approved:', err);
            return 'approved';
        }
    }
};

// ─── NOTIFICATION SERVICE ─────────────────────────────────────────────────────

export const notificationService = {
    _key(userId) {
        return `notifications:${userId}`;
    },

    /** Push a notification */
    async push(userId, { type, message, fromUser, contentId }) {
        const notification = {
            id: generateId(),
            type, // 'like', 'comment', 'follow', 'system'
            message,
            fromUser: fromUser || null,
            contentId: contentId || null,
            read: false,
            createdAt: new Date().toISOString(),
        };
        await kv.pushToList(this._key(userId), notification, 100);
        return notification;
    },

    /** Get all notifications for a user */
    async getAll(userId) {
        return await kv.getList(this._key(userId));
    },

    /** Mark all as read */
    async markAllRead(userId) {
        const list = await this.getAll(userId);
        const updated = list.map((n) => ({ ...n, read: true }));
        await kv.set(this._key(userId), updated);
        return updated;
    },

    /** Get unread count */
    async getUnreadCount(userId) {
        const list = await this.getAll(userId);
        return list.filter((n) => !n.read).length;
    },
};
