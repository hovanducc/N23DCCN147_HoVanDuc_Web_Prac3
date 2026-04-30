'use client';
import { useState } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function PostsPage() {
    const queryClient = useQueryClient();
    
    // State local để quản lý dữ liệu nhập liệu
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [author, setAuthor] = useState('');
    const [editingId, setEditingId] = useState<number | null>(null);
    const [showCommentsId, setShowCommentsId] = useState<number | null>(null);

    // 1. Lấy danh sách bài viết (Query)
    const { data: posts = [], isLoading } = useQuery({
        queryKey: ['posts'],
        queryFn: () => api.get('/api/posts').then(r => r.data)
    });

    // 2. Mutation Thêm hoặc Cập nhật bài viết
    const upsertMutation = useMutation({
        mutationFn: (data: any) => {
            return editingId 
                ? api.put(`/api/posts/${editingId}`, data) 
                : api.post('/api/posts', data);           
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['posts'] }); // Làm mới cache[cite: 1]
            toast.success(editingId ? 'Đã cập nhật bài viết!' : 'Đã đăng bài viết!');
            resetForm();
        },
        onError: () => toast.error('Thao tác thất bại!')
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => api.delete(`/api/posts/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['posts'] });
            toast.success('Đã xóa bài viết');
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !content || !author) return toast.error("Điền đầy đủ thông tin");
        upsertMutation.mutate({ title, content, author });
    };

    const handleEdit = (post: any) => {
        setEditingId(post.id);
        setTitle(post.title);
        setContent(post.content);
        setAuthor(post.author);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const resetForm = () => {
        setEditingId(null);
        setTitle(''); setContent(''); setAuthor('');
    };

    if (isLoading) return <div className="min-h-screen bg-[#0b0f1a] flex items-center justify-center text-blue-500">Đang tải...</div>;

    return (
        <div className="min-h-screen bg-[#0b0f1a] text-slate-300 p-6 font-sans">
            <div className="max-w-xl mx-auto">
                <header className="mb-10 text-center">
                    <h1 className="text-2xl font-bold text-white tracking-tight">Fullstack DevBlog</h1>
                    <p className="text-slate-500 text-xs mt-1 uppercase tracking-widest">TanStack Query + CRUD</p>
                </header>

                {/* Form Input[cite: 1] */}
                <form onSubmit={handleSubmit} className="bg-[#161b22] p-6 rounded-xl border border-slate-800 mb-12 shadow-2xl transition-all">
                    <h2 className="text-[10px] font-black text-blue-500 mb-4 uppercase tracking-tighter">
                        {editingId ? 'Đang chỉnh sửa bài viết' : 'Tạo nội dung mới'}
                    </h2>
                    <div className="space-y-4">
                        <input className="w-full bg-[#0d1117] border border-slate-800 p-3 rounded-lg outline-none focus:border-blue-500/50 transition-all text-sm"
                            value={title} onChange={e => setTitle(e.target.value)} placeholder='Tiêu đề' />
                        <input className="w-full bg-[#0d1117] border border-slate-800 p-3 rounded-lg outline-none focus:border-blue-500/50 transition-all text-sm"
                            value={author} onChange={e => setAuthor(e.target.value)} placeholder='Tác giả' />
                        <textarea className="w-full bg-[#0d1117] border border-slate-800 p-3 rounded-lg outline-none focus:border-blue-500/50 transition-all text-sm min-h-[100px] resize-none"
                            value={content} onChange={e => setContent(e.target.value)} placeholder='Nội dung...' />
                        
                        <div className="flex gap-2">
                            <button disabled={upsertMutation.isPending} className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white py-3 rounded-lg font-bold text-sm transition-all shadow-lg">
                                {upsertMutation.isPending ? 'Đang xử lý...' : (editingId ? 'Lưu thay đổi' : 'Đăng bài viết')}
                            </button>
                            {editingId && (
                                <button type="button" onClick={resetForm} className="px-4 bg-slate-800 hover:bg-slate-700 text-xs rounded-lg transition-colors"> Hủy </button>
                            )}
                        </div>
                    </div>
                </form>

                {/* Danh sách bài viết[cite: 1] */}
                <div className="space-y-5">
                    {posts.map((p: any) => (
                        <div key={p.id} className="bg-[#161b22] p-5 rounded-xl border border-slate-800 shadow-sm">
                            <div className="mb-3">
                                <h3 className="text-lg font-bold text-white tracking-tight leading-tight">{p.title}</h3>
                            </div>
                            <p className="text-slate-400 text-sm leading-relaxed mb-4">{p.content}</p>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] text-slate-500 font-mono italic">By {p.author}</span>
                            </div>

                            <div className="flex justify-between items-center mt-6">
                                <button 
                                    onClick={() => setShowCommentsId(showCommentsId === p.id ? null : p.id)}
                                    className="text-[11px] font-bold text-blue-500 hover:text-blue-400 uppercase tracking-wider"
                                >
                                    {showCommentsId === p.id ? 'Đóng bình luận' : 'Xem bình luận'}
                                </button>
                                <div className="flex gap-4">
                                     <button onClick={() => handleEdit(p)} className="text-slate-500 hover:text-white text-[11px]">Sửa</button>
                                     <button onClick={() => deleteMutation.mutate(p.id)} disabled={deleteMutation.isPending} className="text-slate-500 hover:text-red-500 text-[11px]">Xóa</button>
                                </div>
                            </div>

                            {/* Hiển thị phần bình luận nếu ID khớp */}
                            {showCommentsId === p.id && <CommentSection postId={p.id} />}
                        </div>
                    ))}
                </div>

                {posts.length === 0 && (
                    <div className="text-center py-20 border border-dashed border-slate-800 rounded-xl text-slate-600 text-sm italic">
                        Kho lưu trữ đang trống.
                    </div>
                )}
            </div>
        </div>
    );
}

function CommentSection({ postId }: { postId: number }) {
    const queryClient = useQueryClient();
    const [author, setAuthor] = useState('');
    const [content, setContent] = useState('');

    const { data: comments = [] } = useQuery({
        queryKey: ['comments', postId],
        queryFn: () => api.get(`/api/posts/${postId}/comments`).then(r => r.data)
    });

    const addComment = useMutation({
        mutationFn: (data: any) => api.post(`/api/posts/${postId}/comments`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['comments', postId] });
            setAuthor(''); setContent('');
            toast.success('Đã gửi bình luận');
        },
        onError: () => {
            toast.error('Có lỗi xảy ra khi gửi bình luận!');
        }
    });

    const handleAddComment = () => {
        if (!author.trim() || !content.trim()) {
            toast.error('Vui lòng nhập tên và nội dung bình luận!');
            return;
        }
        addComment.mutate({ author, content });
    };

    return (
        <div className="mt-4 pt-4 border-t border-slate-800 space-y-4">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Bình luận ({comments.length})</h4>
            
            <div className="space-y-3">
                {comments.map((c: any) => (
                    <div key={c.id} className="text-xs bg-[#0d1117] p-3 rounded-lg border border-slate-800 flex justify-between group/item">
                        <div>
                            <span className="text-blue-500 font-bold">{c.author}:</span>
                            <span className="ml-2 text-slate-400">{c.content}</span>
                        </div>
                        <button 
                            onClick={async () => {
                                await api.delete(`/api/comments/${c.id}`);
                                queryClient.invalidateQueries({ queryKey: ['comments', postId] });
                            }}
                            className="opacity-0 group-hover/item:opacity-100 text-red-500 transition-all"
                        > Xóa </button>
                    </div>
                ))}
            </div>

            <div className="flex flex-col gap-2 pt-2">
                <input className="bg-transparent border-b border-slate-800 text-xs py-1 outline-none focus:border-blue-500"
                    value={author} onChange={e => setAuthor(e.target.value)} placeholder="Tên của bạn..." />
                <input className="bg-transparent border-b border-slate-800 text-xs py-1 outline-none focus:border-blue-500"
                    value={content} onChange={e => setContent(e.target.value)} placeholder="Nội dung bình luận..." />
                <button 
                    type="button"
                    onClick={handleAddComment}
                    disabled={addComment.isPending}
                    className="text-[10px] bg-slate-800 hover:bg-slate-700 py-1 rounded transition-colors uppercase font-bold disabled:opacity-50 text-white"
                > 
                    {addComment.isPending ? 'Đang gửi...' : 'Gửi'}
                </button>
            </div>
        </div>
    );
}