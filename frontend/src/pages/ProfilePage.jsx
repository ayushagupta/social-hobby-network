import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { selectAuth, clearAuthError } from '../features/auth/authSlice';
import { selectGroups } from '../features/groups/groupsSlice';
import { fetchGroups } from '../features/groups/groupsThunks';
import { updateUser } from '../features/auth/authThunks';
import { User, Users, Tag, Edit, Loader2 } from 'lucide-react';
import Toast from '../components/Toast';

// A modal component for editing user profile details
function EditProfileModal({ isOpen, onClose, onUpdate, currentUser, isUpdating }) {
  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [hobbies, setHobbies] = useState(currentUser?.hobbies.map(h => h.name).join(', ') || '');

  useEffect(() => {
    // Re-initialize state if the modal is re-opened with new data
    if (currentUser) {
      setName(currentUser.name);
      setEmail(currentUser.email);
      setHobbies(currentUser.hobbies.map(h => h.name).join(', '));
    }
  }, [currentUser, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const hobbiesArray = hobbies.split(',').map(h => h.trim()).filter(Boolean);
    onUpdate({ name, email, hobbies: hobbiesArray });
    // Don't close the modal immediately on submit if it's updating,
    // let the parent component close it on success.
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Edit Your Profile</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="name" className="block text-gray-700 font-semibold mb-2">Name</label>
            <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-2 border rounded-lg" required disabled={isUpdating} />
          </div>
          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-700 font-semibold mb-2">Email</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-2 border rounded-lg" required disabled={isUpdating} />
          </div>
          <div className="mb-6">
            <label htmlFor="hobbies" className="block text-gray-700 font-semibold mb-2">Hobbies (comma-separated)</label>
            <input id="hobbies" type="text" value={hobbies} onChange={(e) => setHobbies(e.target.value)} className="w-full px-4 py-2 border rounded-lg" disabled={isUpdating} />
          </div>
          <div className="flex justify-end gap-4">
            <button type="button" onClick={onClose} className="py-2 px-4 bg-gray-200 rounded-lg" disabled={isUpdating}>Cancel</button>
            <button type="submit" className="py-2 px-6 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 flex items-center justify-center w-24" disabled={isUpdating}>
              {isUpdating ? <Loader2 className="animate-spin" /> : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


export default function ProfilePage() {
  const dispatch = useDispatch();
  const { user, status: authStatus, error: authError } = useSelector(selectAuth);
  const { items: allGroups, status: groupsStatus } = useSelector(selectGroups);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    if (groupsStatus === 'idle') {
      dispatch(fetchGroups());
    }
  }, [groupsStatus, dispatch]);

  const handleUpdateProfile = async (userData) => {
    const resultAction = await dispatch(updateUser(userData));
    // If the update was successful, close the modal
    if (updateUser.fulfilled.match(resultAction)) {
      setIsEditModalOpen(false);
    }
  };

  if (!user) {
    return <div className="text-center p-10">Loading profile...</div>;
  }

  const myGroups = allGroups.filter(group => 
    user.group_memberships?.includes(group.id)
  );

  return (
    <div className="bg-gray-50 min-h-screen">
      {authError && (
        <Toast 
          message={authError} 
          onClose={() => dispatch(clearAuthError())} 
        />
      )}

      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        
        {/* User Profile Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex justify-between items-start">
            <div className="flex items-center mb-6">
              <User className="w-16 h-16 text-blue-500 mr-4" />
              <div>
                <h1 className="text-4xl font-bold text-gray-800 tracking-tight">{user.name}</h1>
                <p className="text-lg text-gray-500">{user.email}</p>
              </div>
            </div>
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Edit size={16} /> Edit
            </button>
          </div>
          
          <div>
            <h2 className="text-2xl font-semibold text-gray-700 mb-3 flex items-center">
              <Tag className="mr-3" /> My Hobbies
            </h2>
            {user.hobbies && user.hobbies.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {user.hobbies.map(hobby => (
                  <span key={hobby.id} className="bg-green-100 text-green-800 text-sm font-semibold px-3 py-1 rounded-full">
                    {hobby.name}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">You haven't added any hobbies yet.</p>
            )}
          </div>
        </div>

        {/* Joined Groups Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4 flex items-center">
            <Users className="mr-3" /> My Groups
          </h2>
          {groupsStatus === 'loading' && <p>Loading your groups...</p>}
          {groupsStatus === 'succeeded' && (
            myGroups.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {myGroups.map(group => (
                  <Link 
                    to={`/groups/${group.id}`} 
                    key={group.id} 
                    className="block bg-gray-100 p-4 rounded-lg hover:bg-blue-100 hover:shadow-lg transition-all"
                  >
                    <h3 className="text-xl font-bold text-gray-800">{group.name}</h3>
                    <p className="text-gray-600 mt-1">{group.description || 'No description.'}</p>
                    <span className="inline-block mt-2 bg-blue-200 text-blue-800 text-xs font-semibold px-2.5 py-1 rounded-full">
                      {group.hobby}
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">You haven't joined any groups yet. Go explore!</p>
            )
          )}
        </div>
      </div>

      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onUpdate={handleUpdateProfile}
        currentUser={user}
        isUpdating={authStatus === 'loading'}
      />
    </div>
  );
}

