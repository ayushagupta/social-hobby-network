import { useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { performSearch } from '../features/search/searchThunks';
import { clearSearchResults, selectSearchResults } from '../features/search/searchSlice';
import { User, Users, MessageSquare } from 'lucide-react';

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();
  const query = searchParams.get('q');
  
  const { results, status, error } = useSelector(selectSearchResults);

  useEffect(() => {
    if (query) {
      dispatch(performSearch(query));
    }
    // Cleanup function to clear results when navigating away
    return () => {
      dispatch(clearSearchResults());
    };
  }, [query, dispatch]);

  const ResultSection = ({ title, icon, items, renderItem }) => {
    if (!items || items.length === 0) return null;
    return (
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-700 mb-4 flex items-center">{icon} {title}</h2>
        <div className="space-y-4">
          {items.map(renderItem)}
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        Search Results for: <span className="text-blue-600">"{query}"</span>
      </h1>

      {status === 'loading' && <p className="text-gray-500">Searching...</p>}
      {status === 'failed' && <p className="text-red-500">Error: {error}</p>}

      {status === 'succeeded' && (
        <>
          <ResultSection
            title="Users"
            icon={<User className="mr-3" />}
            items={results.users}
            renderItem={(user) => (
              <div key={`user-${user.id}`} className="bg-white p-4 rounded-lg shadow-sm">
                <p className="font-semibold text-lg">{user.name}</p>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
            )}
          />

          <ResultSection
            title="Groups"
            icon={<Users className="mr-3" />}
            items={results.groups}
            renderItem={(group) => (
              <Link to={`/groups/${group.id}`} key={`group-${group.id}`} className="block bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <p className="font-semibold text-lg text-blue-600">{group.name}</p>
                <p className="text-sm text-gray-600">{group.description}</p>
                <span className="mt-2 inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-0.5 rounded-full">{group.hobby}</span>
              </Link>
            )}
          />

          <ResultSection
            title="Posts"
            icon={<MessageSquare className="mr-3" />}
            items={results.posts}
            renderItem={(post) => (
              <Link to={`/groups/${post.group_id}`} key={`post-${post.id}`} className="block bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <p className="font-semibold text-lg">{post.title}</p>
                <p className="text-sm text-gray-600 truncate">{post.content}</p>
              </Link>
            )}
          />
          
          {results.users.length === 0 && results.groups.length === 0 && results.posts.length === 0 && (
            <p className="text-gray-500 mt-8 text-center">No results found for your query.</p>
          )}
        </>
      )}
    </div>
  );
}
