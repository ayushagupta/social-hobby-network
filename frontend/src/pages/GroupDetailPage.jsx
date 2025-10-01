import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, Link } from 'react-router-dom';
import { selectAuth } from '../features/auth/authSlice';
import { selectGroups, clearCurrentGroup, clearGroupError } from '../features/groups/groupsSlice';
import { 
  fetchGroupById, 
  fetchGroupMembers, 
  joinGroup, 
  leaveGroup,
  updateGroup
} from '../features/groups/groupsThunks';
import { Users, Edit, LogIn, LogOut } from 'lucide-react';
import Toast from '../components/Toast';

// A modal for editing group details, including transferring admin rights
function EditGroupModal({ isOpen, onClose, onUpdate, group, members, currentUserId }) {
  const [name, setName] = useState(group?.name || '');
  const [description, setDescription] = useState(group?.description || '');
  const [newAdminId, setNewAdminId] = useState('');

  useEffect(() => {
    // Sync state if the group prop changes or modal is re-opened
    setName(group?.name || '');
    setDescription(group?.description || '');
    setNewAdminId(''); // Reset admin selection
  }, [group, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const updateData = { name, description };
    // If a new admin was selected, add their ID to the update payload
    if (newAdminId) {
      updateData.creator_id = parseInt(newAdminId, 10);
    }
    onUpdate(updateData);
    onClose();
  };

  // Filter members to find potential new admins (everyone except the current admin)
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
          
          {/* New section for transferring admin rights, only shows if there are other members */}
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
            <button type="button" onClick={onClose} className="py-2 px-4 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors">
              Cancel
            </button>
            <button type="submit" className="py-2 px-6 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition-colors shadow-sm">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


export default function GroupDetailPage() {
  const { id } = useParams();
  const groupId = parseInt(id, 10);
  const dispatch = useDispatch();

  const { user } = useSelector(selectAuth);
  const { 
    currentGroup, 
    currentGroupStatus, 
    currentGroupMembers, 
    membersStatus,
    error 
  } = useSelector(selectGroups);
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Fetch group details and members when the component mounts
  useEffect(() => {
    if (groupId) {
      dispatch(fetchGroupById(groupId));
      dispatch(fetchGroupMembers(groupId));
    }

    // Cleanup function to clear the state when the component unmounts
    return () => {
      dispatch(clearCurrentGroup());
    };
  }, [dispatch, groupId]);

  const handleJoin = () => dispatch(joinGroup(groupId));
  const handleLeave = () => dispatch(leaveGroup(groupId));
  const handleUpdate = (groupData) => dispatch(updateGroup({ groupId, groupData }));

  const isUserMember = user?.group_memberships?.includes(groupId);
  const isAdmin = user?.id === currentGroup?.creator_id;
  
  // Find the admin object from the members list
  const admin = currentGroupMembers.find(member => member.id === currentGroup?.creator_id);

  if (currentGroupStatus === 'loading') {
    return <div className="text-center p-10">Loading group details...</div>;
  }
  
  if (currentGroupStatus === 'failed') {
    return <div className="text-center p-10 text-red-500">Error: {error || 'Group not found.'}</div>;
  }

  return (
    <div className="bg-gray-50 min-h-screen">
       {error && (
        <Toast 
          message={error} 
          onClose={() => dispatch(clearGroupError())} 
        />
      )}

      <div className="container mx-auto p-4 sm-p-6 lg:p-8">
        {currentGroup && (
          <>
            <header className="mb-8 p-6 bg-white rounded-lg shadow-md">
              <div className="flex justify-between items-center">
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

            <main className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center"><Users className="mr-3" /> Members ({currentGroupMembers.length})</h2>
              {membersStatus === 'loading' && <p>Loading members...</p>}
              {membersStatus === 'succeeded' && (
                <ul className="space-y-3">
                  {currentGroupMembers.map(member => (
                    <li key={member.id} className="p-3 bg-gray-100 rounded-md flex items-center">
                      <span className="font-semibold text-gray-700">{member.name}</span>
                    </li>
                  ))}
                  {currentGroupMembers.length === 0 && <p className="text-gray-500">This group has no members yet.</p>}
                </ul>
              )}
            </main>
          </>
        )}
      </div>

      <EditGroupModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onUpdate={handleUpdate}
        group={currentGroup}
        members={currentGroupMembers}
        currentUserId={user?.id}
      />
    </div>
  );
}

