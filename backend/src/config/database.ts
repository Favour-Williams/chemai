import { supabase } from './supabase';
import { DatabaseCollections } from '../types';

export class SupabaseDatabase {
  constructor() {
    console.log('Supabase database initialized');
  }

  // Users operations
  async createUser(userData: any) {
    const { data, error } = await supabase
      .from('users')
      .insert([userData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async findUserByEmail(email: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async findUserById(id: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async updateUser(id: string, updates: any) {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Elements operations
  async getAllElements() {
    const { data, error } = await supabase
      .from('elements')
      .select('*')
      .order('atomic_number');
    
    if (error) throw error;
    return data || [];
  }

  async findElementBySymbol(symbol: string) {
    const { data, error } = await supabase
      .from('elements')
      .select('*')
      .eq('symbol', symbol)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async searchElements(filters: any) {
    let query = supabase.from('elements').select('*');
    
    if (filters.category) {
      query = query.eq('category', filters.category);
    }
    
    if (filters.group) {
      query = query.eq('group_number', filters.group);
    }
    
    if (filters.period) {
      query = query.eq('period', filters.period);
    }
    
    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,symbol.ilike.%${filters.search}%`);
    }
    
    const { data, error } = await query.order('atomic_number');
    
    if (error) throw error;
    return data || [];
  }

  // Reactions operations
  async getAllReactions(filters: any = {}) {
    let query = supabase.from('reactions').select('*');
    
    if (filters.type) {
      query = query.eq('reaction_type', filters.type);
    }
    
    if (filters.isPublic !== undefined) {
      query = query.eq('is_public', filters.isPublic);
    }
    
    if (filters.userId) {
      query = query.eq('created_by', filters.userId);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  async findReactionById(id: string) {
    const { data, error } = await supabase
      .from('reactions')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async createReaction(reactionData: any) {
    const { data, error } = await supabase
      .from('reactions')
      .insert([reactionData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateReaction(id: string, updates: any) {
    const { data, error } = await supabase
      .from('reactions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async deleteReaction(id: string) {
    const { error } = await supabase
      .from('reactions')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  }

  async searchReactions(filters: any) {
    let query = supabase.from('reactions').select('*');
    
    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,equation.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }
    
    if (filters.reactant) {
      query = query.contains('reactants', [filters.reactant]);
    }
    
    if (filters.product) {
      query = query.contains('products', [filters.product]);
    }
    
    if (filters.type) {
      query = query.eq('reaction_type', filters.type);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  // Chat operations
  async createConversation(conversationData: any) {
    const { data, error } = await supabase
      .from('chat_conversations')
      .insert([conversationData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async getUserConversations(userId: string) {
    const { data, error } = await supabase
      .from('chat_conversations')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('updated_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  async findConversationById(id: string) {
    const { data, error } = await supabase
      .from('chat_conversations')
      .select(`
        *,
        chat_messages (*)
      `)
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async updateConversation(id: string, updates: any) {
    const { data, error } = await supabase
      .from('chat_conversations')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async deleteConversation(id: string) {
    const { error } = await supabase
      .from('chat_conversations')
      .update({ is_active: false })
      .eq('id', id);
    
    if (error) throw error;
    return true;
  }

  async createMessage(messageData: any) {
    const { data, error } = await supabase
      .from('chat_messages')
      .insert([messageData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateMessage(id: string, updates: any) {
    const { data, error } = await supabase
      .from('chat_messages')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async deleteMessage(id: string) {
    const { error } = await supabase
      .from('chat_messages')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  }

  // Safety data operations
  async getAllSafetyData() {
    const { data, error } = await supabase
      .from('safety_data')
      .select('*')
      .order('element_symbol');
    
    if (error) throw error;
    return data || [];
  }

  async findSafetyDataBySymbol(symbol: string) {
    const { data, error } = await supabase
      .from('safety_data')
      .select('*')
      .eq('element_symbol', symbol)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  // Generic operations for backward compatibility
  async read<T extends keyof DatabaseCollections>(collection: T): Promise<any[]> {
    switch (collection) {
      case 'users':
        return this.getAllUsers();
      case 'elements':
        return this.getAllElements();
      case 'reactions':
        return this.getAllReactions();
      case 'safetyData':
        return this.getAllSafetyData();
      default:
        return [];
    }
  }

  async findOne<T extends keyof DatabaseCollections>(
    collection: T,
    predicate: (item: any) => boolean
  ): Promise<any | null> {
    const data = await this.read(collection);
    return data.find(predicate) || null;
  }

  async findMany<T extends keyof DatabaseCollections>(
    collection: T,
    predicate?: (item: any) => boolean
  ): Promise<any[]> {
    const data = await this.read(collection);
    return predicate ? data.filter(predicate) : data;
  }

  async insert<T extends keyof DatabaseCollections>(
    collection: T,
    item: any
  ): Promise<void> {
    switch (collection) {
      case 'users':
        await this.createUser(item);
        break;
      case 'reactions':
        await this.createReaction(item);
        break;
      default:
        throw new Error(`Insert not implemented for collection: ${collection}`);
    }
  }

  async update<T extends keyof DatabaseCollections>(
    collection: T,
    predicate: (item: any) => boolean,
    updateFn: (item: any) => any
  ): Promise<boolean> {
    // This is a simplified implementation
    // In practice, you'd need to implement specific update methods
    return false;
  }

  async delete<T extends keyof DatabaseCollections>(
    collection: T,
    predicate: (item: any) => boolean
  ): Promise<boolean> {
    // This is a simplified implementation
    // In practice, you'd need to implement specific delete methods
    return false;
  }

  private async getAllUsers() {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }
}

export const db = new SupabaseDatabase();