// import { Outlet, NavLink } from 'react-router-dom';
// import { useAuth } from './context/AuthProvider';

// export default function App() {
//   const { user, loading } = useAuth();

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center min-h-screen">
//         <div className="h-6 w-6 animate-spin rounded-full border-2 border-sk-red border-t-transparent"></div>
//         <span className="ml-2 text-gray-600 text-sm">Loading...</span>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-[#F7F7F7]">
//       <header className="bg-white border-b border-gray-200">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
//           <div className="flex items-center space-x-3">
//             <div className="text-2xl">👑</div>
//             <div>
//               <h1 className="text-2xl font-bold text-gray-900">
//                 Tool Tracker Lookup
//               </h1>
//               <p className="text-sm text-gray-500">
//                 Resource for tracking integrations and capabilities.
//               </p>
//             </div>
//           </div>
//           <nav className="space-x-4">
//             <NavLink
//               to="/tools"
//               className={({ isActive }) =>
//                 `hover:underline ${isActive ? 'font-semibold text-sk-red' : ''}`
//               }
//             >
//               Tools
//             </NavLink>
//             {user?.role === 'admin' && (
//               <NavLink
//                 to="/users"
//                 className={({ isActive }) =>
//                   `hover:underline ${isActive ? 'font-semibold text-sk-red' : ''}`
//                 }
//               >
//                 Users
//               </NavLink>
//             )}
//           </nav>
//           <div className="text-sm text-gray-600">{user?.email ?? 'Not logged in'}</div>
//         </div>
//       </header>

//       <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
//         <Outlet />
//       </main>
//     </div>
//   );
// }
import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from './context/AuthProvider';

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-sk-red border-t-transparent"></div>
        <span className="ml-2 text-gray-600 text-sm">Loading...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">👑</div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Tool Tracker Lookup</h1>
              <p className="text-sm text-gray-500">
                Resource for tracking integrations and capabilities.
              </p>
            </div>
          </div>
          <nav className="space-x-4">
            <NavLink
              to="/tools"
              className={({ isActive }) =>
                `hover:underline ${isActive ? 'font-semibold text-sk-red' : ''}`
              }
            >
              Tools
            </NavLink>
            {user?.role === 'admin' && (
              <NavLink
                to="/users"
                className={({ isActive }) =>
                  `hover:underline ${isActive ? 'font-semibold text-sk-red' : ''}`
                }
              >
                Users
              </NavLink>
            )}
          </nav>
          <div className="text-sm text-gray-600">{user?.email ?? 'Not logged in'}</div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>
    </div>
  );
}
