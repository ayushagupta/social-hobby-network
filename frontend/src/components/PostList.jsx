import { useSelector } from 'react-redux';
import { selectPosts } from '../features/posts/postsSlice';

export default function PostList() {
  const { items: posts, status, error } = useSelector(selectPosts);

  if (status === 'loading') {
    return <p className="text-center text-gray-500 py-4">Loading posts...</p>;
  }

  if (status === 'failed') {
    return <p className="text-center text-red-500 py-4">Error: {error}</p>;
  }
  
  return (
    <div className="space-y-4">
      {posts.length > 0 ? (
        posts.map(post => (
          <div key={post.id} className="bg-white p-4 rounded-lg shadow">
            <h4 className="text-xl font-bold text-gray-900">{post.title}</h4>
            <p className="text-xs text-gray-500 mb-2">
              Posted by <span className="font-semibold">{post.owner.name}</span> on {new Date(post.created_at).toLocaleDateString()}
            </p>
            <p className="text-gray-700 whitespace-pre-wrap">{post.content}</p>
          </div>
        ))
      ) : (
        <div className="bg-white text-center text-gray-500 p-6 rounded-lg shadow">
          <p>No posts in this group yet. Be the first to share something!</p>
        </div>
      )}
    </div>
  );
}
