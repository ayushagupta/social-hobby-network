import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { selectAuth } from '../features/auth/authSlice';
import { 
  fetchGroupById, 
  fetchGroupMembers, 
  joinGroup, 
  leaveGroup,
  updateGroup
} from '../features/groups/groupsThunks';
import { fetchPostsForGroup, createPostInGroup } from '../features/posts/postsThunks';
import { clearPosts } from '../features/posts/postsSlice';
import { Users, Edit, LogIn, LogOut, MessageSquare, Send } from 'lucide-react';
import Toast from '../components/Toast';
import PostList from '../components/PostList';
import MemberList from '../components/MemberList';

// A sub-component for the "Create Post" form, visible only to members.
function CreatePostForm({ groupId }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const dispatch = useDispatch();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    dispatch(createPostInGroup({ groupId, postData: { title, content } }));
    setTitle('');
    setContent('');
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow mb-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-2">Create a New Post</h3>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Post Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full p-2 border rounded-md mb-2 focus:ring-2 focus:ring-blue-500"
          required
        />
        <textarea
          placeholder="Share something with the group..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full p-2 border rounded-md mb-2 focus:ring-2 focus:ring-blue-500"
          rows="3"
          required
        ></textarea>
        <button type="submit" className="w-full flex justify-center items-center gap-2 py-2 px-4 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition-colors">
          <Send size={18} /> Post
        </button>
      </form>
    </div>
  );
}

// Main component for the Group Detail Page
export default function GroupDetailPage() {
  const { id } = useParams();
  const groupId = parseInt(id, 10);
  const dispatch = useDispatch();

  const { user } = useSelector(selectAuth);
  
  // This page now manages its own state for group-specific data
  const [currentGroup, setCurrentGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'succeeded' | 'failed'
  const [error, setError] = useState(null);

  // Effect to fetch all necessary data when the page loads
  useEffect(() => {
    if (groupId) {
      setStatus('loading');
      // Fetch group details, members, and posts in parallel for faster loading
      Promise.all([
        dispatch(fetchGroupById(groupId)).unwrap(),
        dispatch(fetchGroupMembers(groupId)).unwrap(),
        dispatch(fetchPostsForGroup(groupId)) // No unwrap needed if we don't need its direct result here
      ])
      .then(([groupData, membersData]) => {
        setCurrentGroup(groupData);
        setMembers(membersData);
        setStatus('succeeded');
      })
      .catch((err) => {
        // Use the specific error from the rejected thunk if available
        setError(err || 'Failed to load group data.');
        setStatus('failed');
      });
    }

    // Cleanup function to clear the posts slice when navigating away
    return () => {
      dispatch(clearPosts());
    };
  }, [dispatch, groupId]);

  // Event handlers
  const handleJoin = () => dispatch(joinGroup(groupId));
  const handleLeave = () => dispatch(leaveGroup(groupId));
  // Note: Edit/Update functionality would require an EditGroupModal and handler here

  // Derived state for easy access in JSX
  const isUserMember = user?.group_memberships?.includes(groupId);
  const isAdmin = user?.id === currentGroup?.creator_id;
  const admin = members.find(member => member.id === currentGroup?.creator_id);

  if (status === 'loading') {
    return <div className="text-center p-10 text-gray-500">Loading group...</div>;
  }
  
  if (status === 'failed') {
    return <div className="text-center p-10 text-red-500">Error: {error}</div>;
  }

  return (
    <>
       {error && <Toast message={error} onClose={() => setError(null)} />}
       
       <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        {currentGroup && (
          <>
            {/* Group Header */}
            <header className="mb-8 p-6 bg-white rounded-lg shadow-md">
              <div className="flex flex-wrap justify-between items-center gap-4">
                <div>
                  <h1 className="text-4xl font-bold text-gray-800 tracking-tight">{currentGroup.name}</h1>
                  <p className="text-lg text-gray-500 mt-1">A group for <span className="font-semibold text-blue-600">{currentGroup.hobby}</span></p>
                </div>
                {isAdmin ? (
                  <button className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white font-semibold rounded-lg shadow-md hover:bg-yellow-600 transition-all">
                    <Edit size={20} /> Edit Group
                  </button>
                ) : isUserMember ? (
                  <button onClick={handleLeave} className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg shadow-md hover:bg-gray-300 transition-all">
                    <LogOut size={20} /> Leave Group
                  </button>
                ) : (
                  <button onClick={handleJoin} className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white font-semibold rounded-lg shadow-md hover:bg-green-600 transition-all">
                    <LogIn size={20} /> Join Group
                  </button>
                )}
              </div>
              <p className="text-gray-700 mt-4">{currentGroup.description}</p>
              {admin && (
                <p className="text-sm text-gray-500 mt-4">
                  Admin: <span className="font-semibold">{admin.name}</span>
                </p>
              )}
            </header>

            {/* Main Content Area: Posts and Members */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left/Main Column: Posts */}
              <div className="lg:col-span-2">
                <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center"><MessageSquare className="mr-3" /> Posts</h2>
                {isUserMember && <CreatePostForm groupId={groupId} />}
                <PostList />
              </div>

              {/* Right Column: Members */}
              <div className="lg:col-span-1">
                <MemberList members={members} status={status} />
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}

