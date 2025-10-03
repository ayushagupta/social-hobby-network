import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { selectAuth } from '../features/auth/authSlice';
import { selectGroups, clearCurrentGroup, clearGroupError } from '../features/groups/groupsSlice';
import { selectPosts, clearPosts } from '../features/posts/postsSlice';
import { fetchGroupById, fetchGroupMembers, joinGroup, leaveGroup } from '../features/groups/groupsThunks';
import { fetchPostsForGroup, createPostInGroup } from '../features/posts/postsThunks';
import { Users, Edit, LogIn, LogOut, MessageSquare, Send } from 'lucide-react';
import Toast from '../components/Toast';
import PostList from '../components/PostList';
import MemberList from '../components/MemberList';

function CreatePostForm({ groupId }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const dispatch = useDispatch();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    const postData = { title, content };
    dispatch(createPostInGroup({ groupId, postData }));
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
          placeholder="What's on your mind?"
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


// --- Main Page Component ---

export default function GroupDetailPage() {
  const { id } = useParams();
  const groupId = parseInt(id, 10);
  const dispatch = useDispatch();

  const { user } = useSelector(selectAuth);
  const { currentGroup, currentGroupStatus, currentGroupMembers, membersStatus, error: groupError } = useSelector(selectGroups);
  
  // Fetch all necessary data on component mount
  useEffect(() => {
    if (groupId) {
      dispatch(fetchGroupById(groupId));
      dispatch(fetchGroupMembers(groupId));
      dispatch(fetchPostsForGroup(groupId));
    }

    // Cleanup function to clear state when leaving the page
    return () => {
      dispatch(clearCurrentGroup());
      dispatch(clearPosts());
    };
  }, [dispatch, groupId]);

  const handleJoin = () => dispatch(joinGroup(groupId));
  const handleLeave = () => dispatch(leaveGroup(groupId));

  const isUserMember = user?.group_memberships?.includes(groupId);
  const isAdmin = user?.id === currentGroup?.creator_id;

  // Find the admin object from the members list to display their name
  const admin = currentGroupMembers.find(member => member.id === currentGroup?.creator_id);

  if (currentGroupStatus === 'loading') {
    return <div className="text-center p-10">Loading group...</div>;
  }
  
  if (currentGroupStatus === 'failed') {
    return <div className="text-center p-10 text-red-500">Error: {groupError || 'Group not found.'}</div>;
  }

  return (
    <div className="bg-gray-50 min-h-screen">
       {groupError && <Toast message={groupError} onClose={() => dispatch(clearGroupError())} />}

      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        {currentGroup && (
          <>
            {/* Group Header */}
            <header className="mb-8 p-6 bg-white rounded-lg shadow-md">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-4xl font-bold text-gray-800">{currentGroup.name}</h1>
                  <p className="text-lg text-gray-500 mt-1">Hobby: <span className="font-semibold text-blue-600">{currentGroup.hobby}</span></p>
                </div>
                 {/* Join/Leave/Edit Buttons */}
                {isAdmin ? (
                  <button className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white font-semibold rounded-lg shadow-md hover:bg-yellow-600">
                    <Edit size={20} /> Edit
                  </button>
                ) : isUserMember ? (
                  <button onClick={handleLeave} className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg shadow-md hover:bg-gray-300">
                    <LogOut size={20} /> Leave
                  </button>
                ) : (
                  <button onClick={handleJoin} className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white font-semibold rounded-lg shadow-md hover:bg-green-600">
                    <LogIn size={20} /> Join
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
                <MemberList members={currentGroupMembers} status={membersStatus} />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

