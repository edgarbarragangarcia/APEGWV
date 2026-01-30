import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send, Loader2, ArrowLeft } from 'lucide-react';
import { supabase, optimizeImage } from '../services/SupabaseManager';
import type { Database } from '../types/database.types';

type Message = Database['public']['Tables']['messages']['Row'];

interface ChatModalProps {
    isOpen: boolean;
    onClose: () => void;
    buyerId: string;
    sellerId: string;
    productId: string;
    productName: string;
    productImage: string | null;
    buyerName: string;
    buyerPhoto: string | null;
    currentUserId: string; // To distinguish sender
}

const ChatModal: React.FC<ChatModalProps> = ({
    isOpen,
    onClose,
    buyerId,
    sellerId,
    productId,
    productName,
    productImage,
    buyerName,
    currentUserId
}) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [chatId, setChatId] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen) {
            initializeChat();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, buyerId, sellerId, productId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const initializeChat = async () => {
        setLoading(true);
        try {
            // 1. Check if chat exists
            let { data: chat, error } = await supabase
                .from('chats')
                .select('id')
                .eq('buyer_id', buyerId)
                .eq('seller_id', sellerId)
                .eq('product_id', productId)
                .maybeSingle();

            if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows found"
                console.error('Error fetching chat:', error);
                return;
            }

            let currentChatId = chat?.id;

            // 2. If not, create it
            if (!currentChatId) {
                const { data: newChat, error: createError } = await supabase
                    .from('chats')
                    .insert({
                        buyer_id: buyerId,
                        seller_id: sellerId,
                        product_id: productId
                    })
                    .select()
                    .maybeSingle();

                if (createError) throw createError;
                if (!newChat) throw new Error('Failed to create chat');
                currentChatId = newChat.id;
            }

            setChatId(currentChatId);

            // 3. Fetch messages
            if (currentChatId) {
                const { data: msgs, error: msgsError } = await supabase
                    .from('messages')
                    .select('*')
                    .eq('chat_id', currentChatId)
                    .order('created_at', { ascending: true });

                if (msgsError) throw msgsError;
                setMessages(msgs || []);

                // 4. Subscribe to new messages
                const channel = supabase
                    .channel(`chat:${currentChatId}`)
                    .on(
                        'postgres_changes',
                        {
                            event: 'INSERT',
                            schema: 'public',
                            table: 'messages',
                            filter: `chat_id=eq.${currentChatId}`
                        },
                        (payload) => {
                            setMessages(prev => [...prev, payload.new as Message]);
                        }
                    )
                    .subscribe();

                return () => {
                    supabase.removeChannel(channel);
                };
            }

        } catch (err) {
            console.error('Error initializing chat:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !chatId || !currentUserId) return;

        setSending(true);
        try {
            const { error } = await supabase
                .from('messages')
                .insert({
                    chat_id: chatId,
                    sender_id: currentUserId,
                    content: newMessage.trim()
                });

            if (error) throw error;
            setNewMessage('');
            if (navigator.vibrate) navigator.vibrate(50);
        } catch (err) {
            console.error('Error sending message:', err);
            alert('Error al enviar mensaje');
        } finally {
            setSending(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 10000,
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: 'var(--primary)',
        }}>
            {/* Header */}
            <div className="glass" style={{
                padding: '15px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: '15px',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                zIndex: 10
            }}>
                <button onClick={onClose} style={{ color: 'white' }}>
                    <ArrowLeft size={24} />
                </button>
                <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'white' }}>{buyerName}</h3>
                    <p style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
                        Interesado en {productName}
                    </p>
                </div>
                <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    background: 'rgba(255,255,255,0.05)'
                }}>
                    {productImage && (
                        <img
                            src={optimizeImage(productImage, { width: 80, height: 80 })}
                            alt="Product"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                    )}
                </div>
            </div>

            {/* Messages Area */}
            <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '15px',
                backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(16, 185, 129, 0.05) 0%, transparent 50%)'
            }}>
                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '50px' }}>
                        <Loader2 className="animate-spin" color="var(--secondary)" />
                    </div>
                ) : messages.length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'var(--text-dim)', marginTop: '50px', padding: '0 40px' }}>
                        <p>No hay mensajes aún.</p>
                        <p style={{ fontSize: '13px', marginTop: '8px' }}>Escribe un mensaje para iniciar la conversación.</p>
                    </div>
                ) : (
                    messages.map((msg) => {
                        const isMe = msg.sender_id === currentUserId;
                        return (
                            <motion.div
                                key={msg.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                style={{
                                    alignSelf: isMe ? 'flex-end' : 'flex-start',
                                    maxWidth: '80%',
                                }}
                            >
                                <div style={{
                                    backgroundColor: isMe ? 'var(--secondary)' : 'rgba(255,255,255,0.1)',
                                    color: isMe ? 'var(--primary)' : 'white',
                                    padding: '12px 16px',
                                    borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    lineHeight: '1.4',
                                    boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                                }}>
                                    {msg.content}
                                </div>
                                <div style={{
                                    fontSize: '10px',
                                    color: 'var(--text-dim)',
                                    marginTop: '4px',
                                    textAlign: isMe ? 'right' : 'left',
                                    padding: '0 4px'
                                }}>
                                    {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                </div>
                            </motion.div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="glass" style={{
                padding: '15px 20px',
                borderTop: '1px solid rgba(255,255,255,0.05)',
                paddingBottom: 'calc(15px + env(safe-area-inset-bottom))'
            }}>
                <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '10px' }}>
                    <input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Escribe un mensaje..."
                        style={{
                            flex: 1,
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '24px',
                            padding: '12px 20px',
                            color: 'white',
                            fontSize: '15px',
                            outline: 'none'
                        }}
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim() || sending}
                        style={{
                            background: 'var(--secondary)',
                            color: 'var(--primary)',
                            width: '46px',
                            height: '46px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: 'none',
                            cursor: 'pointer',
                            opacity: (!newMessage.trim() || sending) ? 0.5 : 1,
                            transition: 'all 0.2s'
                        }}
                    >
                        {sending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChatModal;
