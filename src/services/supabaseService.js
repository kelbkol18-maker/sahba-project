import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Basic CRUD operations (example for 'posts' table)
export const postService = {
  async create(post) {
    const { data, error } = await supabase.from('posts').insert([post]).select();
    if (error) throw error;
    return data[0];
  },
  async getAll() {
    const { data, error } = await supabase.from('posts').select('*');
    if (error) throw error;
    return data;
  },
  async getById(id) {
    const { data, error } = await supabase.from('posts').select('*').eq('id', id).single();
    if (error) throw error;
    return data;
  },
  async update(id, updates) {
    const { data, error } = await supabase.from('posts').update(updates).eq('id', id).select();
    if (error) throw error;
    return data[0];
  },
  async delete(id) {
    const { error } = await supabase.from('posts').delete().eq('id', id);
    if (error) throw error;
    return true;
  },
};

// Example for channel service
export const channelService = {
  async getByOwner(userId) {
    const { data, error } = await supabase.from('channels').select('*').eq('owner_id', userId).single();
    if (error) {
      if (error.code === 'PGRST116') return null; // No rows found
      throw error;
    }
    return data;
  },
  async create(channel) {
    const { data, error } = await supabase.from('channels').insert([channel]).select();
    if (error) throw error;
    return data[0];
  },
  async getById(channelId) {
    const { data, error } = await supabase.from('channels').select('*').eq('id', channelId).single();
    if (error) throw error;
    return data;
  }
};

// Add other services as needed (users, videos, shorts, comments, etc.)
export const userService = {
  async getById(userId) {
    const { data, error } = await supabase.from('users').select('*').eq('id', userId).single();
    if (error) throw error;
    return data;
  },
  async update(id, updates) {
    const { data, error } = await supabase.from('users').update(updates).eq('id', id).select();
    if (error) throw error;
    return data[0];
  },
};

export const videoService = {
  async create(video) {
    const { data, error } = await supabase.from('videos').insert([video]).select();
    if (error) throw error;
    return data[0];
  },
  async getAll() {
    const { data, error } = await supabase.from('videos').select('*');
    if (error) throw error;
    return data;
  },
  async getByChannelId(channelId) {
    const { data, error } = await supabase.from('videos').select('*').eq('channel_id', channelId);
    if (error) throw error;
    return data;
  }
};

export const shortsService = {
  async create(short) {
    const { data, error } = await supabase.from('shorts').insert([short]).select();
    if (error) throw error;
    return data[0];
  },
  async getAll() {
    const { data, error } = await supabase.from('shorts').select('*');
    if (error) throw error;
    return data;
  },
};

export const commentService = {
  async create(comment) {
    const { data, error } = await supabase.from('comments').insert([comment]).select();
    if (error) throw error;
    return data[0];
  },
  async getByPostId(postId) {
    const { data, error } = await supabase.from('comments').select('*').eq('post_id', postId);
    if (error) throw error;
    return data;
  },
};

export const notificationService = {
  async create(notification) {
    const { data, error } = await supabase.from('notifications').insert([notification]).select();
    if (error) throw error;
    return data[0];
  },
  async getByUserId(userId) {
    const { data, error } = await supabase.from('notifications').select('*').eq('user_id', userId);
    if (error) throw error;
    return data;
  },
};

export const messageService = {
  async create(message) {
    const { data, error } = await supabase.from('messages').insert([message]).select();
    if (error) throw error;
    return data[0];
  },
  async getByConversationId(conversationId) {
    const { data, error } = await supabase.from('messages').select('*').eq('conversation_id', conversationId);
    if (error) throw error;
    return data;
  },
};

export const bookmarkService = {
  async create(bookmark) {
    const { data, error } = await supabase.from('bookmarks').insert([bookmark]).select();
    if (error) throw error;
    return data[0];
  },
  async getByUserId(userId) {
    const { data, error } = await supabase.from('bookmarks').select('*').eq('user_id', userId);
    if (error) throw error;
    return data;
  },
};

export const followService = {
  async create(follow) {
    const { data, error } = await supabase.from('follows').insert([follow]).select();
    if (error) throw error;
    return data[0];
  },
  async getFollowers(channelId) {
    const { data, error } = await supabase.from('follows').select('follower_id').eq('channel_id', channelId);
    if (error) throw error;
    return data;
  },
  async getFollowing(followerId) {
    const { data, error } = await supabase.from('follows').select('channel_id').eq('follower_id', followerId);
    if (error) throw error;
    return data;
  },
};


export const storageService = {
  async uploadFile(file, bucket, path = null) {
    try {
      const fileName = `${Date.now()}_${file.name}`;
      const filePath = path ? `${path}/${fileName}` : fileName;

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  },

  async deleteFile(bucket, filePath) {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([filePath]);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  },

  getPublicUrl(bucket, filePath) {
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return publicUrl;
  },
};
