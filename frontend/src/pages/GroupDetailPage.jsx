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

// A modal for editing group details, including transferring admin rights.
function EditGroupModal({ isOpen, onClose, onUpdate, group, members, currentUserId }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [newAdminId, setNewAdminId] = useState('');

  useEffect(() => {
    // When the modal opens, populate the form with the current group's data.
    if (group) {
      setName(group.name);
      setDescription(group.description || '');
      setNewAdminId(''); // Reset admin selection
    }
  }, [group, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const updateData = { name, description };
    // If a new admin was selected, add their ID to the update payload.
    if (newAdminId) {
      updateData.creator_id = parseInt(newAdminId, 10);
    }
    onUpdate(updateData);
    onClose();
  };

  // Filter members to find potential new admins (everyone except the current admin).
  const potentialAdmins = members.filter(member => member.id !== currentUserId);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Edit Group Details</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="edit-name" className="block text-gray-700 font-semibold mb-2">Group Name</label>
            <input
              id="edit-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="edit-description" className="block text-gray-700 font-semibold mb-2">Description</label>
            <textarea
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows="4"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            ></textarea>
          </div>
          
          {potentialAdmins.length > 0 && (
            <div className="mb-6">
              <label htmlFor="admin-transfer" className="block text-gray-700 font-semibold mb-2">Transfer Admin Rights</label>
              <select
                id="admin-transfer"
                value={newAdminId}
                onChange={(e) => setNewAdminId(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Keep current admin --</option>
                {potentialAdmins.map(member => (
                  <option key={member.id} value={member.id}>{member.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex justify-end gap-4">
            <button type="button" onClick={onClose} className="py-2 px-4 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Cancel</button>
            <button type="submit" className="py-2 px-6 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  );
}


// Main component for the Group Detail Page
export default function GroupDetailPage() {
  const { id } = useParams();
  const groupId = parseInt(id, 10);
  const dispatch = useDispatch();

  const { user } = useSelector(selectAuth);
  
  const [currentGroup, setCurrentGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    if (groupId) {
      setStatus('loading');
      Promise.all([
        dispatch(fetchGroupById(groupId)).unwrap(),
        dispatch(fetchGroupMembers(groupId)).unwrap(),
        dispatch(fetchPostsForGroup(groupId))
      ])
      .then(([groupData, membersData]) => {
        setCurrentGroup(groupData);
        setMembers(membersData);
        setStatus('succeeded');
      })
      .catch((err) => {
        setError(err || 'Failed to load group data.');
        setStatus('failed');
      });
    }

    return () => {
      dispatch(clearPosts());
    };
  }, [dispatch, groupId]);

  const handleJoin = () => dispatch(joinGroup(groupId));
  const handleLeave = () => dispatch(leaveGroup(groupId));

  const handleUpdate = (groupData) => {
    dispatch(updateGroup({ groupId, groupData }))
      .unwrap()
      .then((updatedGroup) => {
        // Optimistically update the local state for an instant UI change
        setCurrentGroup(updatedGroup);
        // If the admin was changed, we may need to refetch members to be perfectly in sync
        // or update the admin display logic. For now, this provides an instant name/desc update.
      })
      .catch((err) => {
        setError(err || "Failed to update group.");
      });
  };

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
            <header className="mb-8 p-6 bg-white rounded-lg shadow-md">
              <div className="flex flex-wrap justify-between items-center gap-4">
                <div>
                  <h1 className="text-4xl font-bold text-gray-800 tracking-tight">{currentGroup.name}</h1>
                  <p className="text-lg text-gray-500 mt-1">A group for <span className="font-semibold text-blue-600">{currentGroup.hobby}</span></p>
                </div>
                {isAdmin ? (
                  <button onClick={() => setIsEditModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white font-semibold rounded-lg shadow-md hover:bg-yellow-600 transition-all">
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center"><MessageSquare className="mr-3" /> Posts</h2>
                {isUserMember && <CreatePostForm groupId={groupId} />}
                <PostList />
              </div>
              <div className="lg:col-span-1">
                <MemberList members={members} status={status} />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Render the modal and pass all necessary props */}
      <EditGroupModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onUpdate={handleUpdate}
        group={currentGroup}
        members={members}
        currentUserId={user?.id}
      />
    </>
  );
}

