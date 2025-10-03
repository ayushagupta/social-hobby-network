import { Users } from 'lucide-react';

export default function MemberList({ members, status }) {
  if (status === 'loading') {
    return <div className="text-center text-gray-500 p-4">Loading members...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
        <Users className="mr-2" /> Members ({members.length})
      </h3>
      <ul className="space-y-2">
        {members.map(member => (
          <li key={member.id} className="p-2 bg-gray-50 rounded-md font-medium text-gray-700">
            {member.name}
          </li>
        ))}
        {members.length === 0 && <p className="text-gray-500 text-sm mt-2">This group has no members yet.</p>}
      </ul>
    </div>
  );
}
