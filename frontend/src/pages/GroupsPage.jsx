import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { selectAuth } from '../features/auth/authSlice';
import { selectGroups, clearGroupError } from '../features/groups/groupsSlice';
import { fetchGroups, joinGroup, leaveGroup, createGroup } from '../features/groups/groupsThunks';
import { PlusCircle } from 'lucide-react';
import Toast from '../components/Toast';

function CreateGroupModal({ isOpen, onClose, onCreate }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [hobby, setHobby] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onCreate({ name, description, hobby });
    // Reset form for next time and close
    setName('');
    setDescription('');
    setHobby('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Create a New Group</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="name" className="block text-gray-700 font-semibold mb-2">Group Name</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="hobby" className="block text-gray-700 font-semibold mb-2">Main Hobby</label>
            <input
              id="hobby"
              type="text"
              value={hobby}
              onChange={(e) => setHobby(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., hiking, coding, painting"
              required
            />
          </div>
          <div className="mb-6">
            <label htmlFor="description" className="block text-gray-700 font-semibold mb-2">Description</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows="3"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            ></textarea>
          </div>
          <div className="flex justify-end gap-4">
            <button type="button" onClick={onClose} className="py-2 px-4 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors">
              Cancel
            </button>
            <button type="submit" className="py-2 px-6 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition-colors shadow-sm">
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


export default function GroupsPage() {
  const dispatch = useDispatch();
  const { user } = useSelector(selectAuth);
  const { items: allGroups, status, error } = useSelector(selectGroups);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch groups only if they haven't been fetched yet
  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchGroups());
    }
  }, [status, dispatch]);

  const handleJoin = (groupId) => dispatch(joinGroup(groupId));
  const handleLeave = (groupId) => dispatch(leaveGroup(groupId));
  const handleCreateGroup = (groupData) => dispatch(createGroup(groupData));

  // Helper function to determine if the current user is a member of a group
  const isUserMemberOf = (groupId) => user?.group_memberships?.includes(groupId);

  return (
    <div className="bg-gray-50 min-h-screen">
      {error && (
        <Toast 
          message={error} 
          onClose={() => dispatch(clearGroupError())} 
        />
      )}

      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <header className="flex justify-between items-center mb-8 pb-4 border-b">
          <h1 className="text-4xl font-bold text-gray-800 tracking-tight">Explore Groups</h1>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg shadow-md hover:bg-blue-600 transition-all"
          >
            <PlusCircle size={20} />
            Create Group
          </button>
        </header>

        {status === 'loading' && <p className="text-center text-gray-500 mt-8">Loading groups...</p>}
        
        {status === 'succeeded' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {allGroups.map((group) => (
              <div key={group.id} className="bg-white rounded-xl shadow-lg overflow-hidden transition-transform hover:scale-[1.03] flex flex-col">
                <div className="p-6 flex-grow">
                  <div className="flex justify-between items-start mb-2">
                    <Link to={`/groups/${group.id}`} className="block">
                      <h2 className="text-2xl font-bold text-gray-900 hover:text-blue-600 transition-colors">{group.name}</h2>
                    </Link>
                    <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap">{group.hobby}</span>
                  </div>
                  <p className="text-gray-600 mt-2 mb-4 flex-grow">{group.description || 'No description provided.'}</p>
                </div>
                <div className="p-6 pt-0">
                  {isUserMemberOf(group.id) ? (
                    <button
                      onClick={() => handleLeave(group.id)}
                      className="w-full py-2 px-4 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Leave Group
                    </button>
                  ) : (
                    <button
                      onClick={() => handleJoin(group.id)}
                      className="w-full py-2 px-4 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition-colors"
                    >
                      Join Group
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <CreateGroupModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={handleCreateGroup}
      />
    </div>
  );
}

