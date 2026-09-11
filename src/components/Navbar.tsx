
import {
  Bell,
  MapPin,
  Moon,
  Sun,
  UserCircle,
} from "lucide-react";

import { Link } from "react-router-dom";

type NavbarProps = {
  darkMode: boolean;
  setDarkMode: React.Dispatch<React.SetStateAction<boolean>>;
};

type LoggedInUser = {
  uid: number;
  loginname: string;
  firstname: string;
  lastname: string;
  email: string;
  mtype: string;
};

function Navbar({ darkMode, setDarkMode }: NavbarProps) {
  const storedUser = localStorage.getItem("login_user");
  let user: LoggedInUser | null = null;

  if (storedUser) {
    try {
      user = JSON.parse(storedUser);
    } catch (error) {
      console.error("Failed to parse logged-in user:", error);
    }
  }

  return (
    <header className="h-16 border-b border-[#7c3996] bg-white transition-colors dark:border-gray-700 dark:bg-gray-950 dark:text-white shadow-sm">
      <div className="flex h-full items-center justify-between px-6">

        <Link to="/" className="flex items-center">
          <img
            src="/src/assets/rblogo.png"
            alt="Bridge"
            className="h-14 w-auto"
          />
        </Link>

        <div className="flex items-center gap-2">

          {/* Logged-in user */}
          {user && (
            <div className="mr-2 hidden items-center text-sm md:flex">
              <span className="font-medium text-gray-800 dark:text-white">
                {user.uid}
              </span>

              <span className="mx-2 text-gray-400">
                |
              </span>

              <span className="text-gray-600 dark:text-gray-300">
                {user.mtype}
              </span>
            </div>
          )}

          <button
            type="button"
            aria-label={
              darkMode
                ? "Switch to light mode"
                : "Switch to dark mode"
            }
            onClick={() => setDarkMode(!darkMode)}
            className="flex items-center justify-center rounded-lg p-2 text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white md:hidden"
          >
            {darkMode ? (
              <Sun size={20} strokeWidth={1.8} />
            ) : (
              <Moon size={20} strokeWidth={1.8} />
            )}
          </button>

          <button
            type="button"
            aria-label="Notifications"
            className="rounded-lg p-2 text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 dark:text-white dark:hover:bg-gray-800"
          >
            <Bell size={20} strokeWidth={1.8} />
          </button>

          <button
            type="button"
            aria-label="Location"
            className="rounded-lg p-2 text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 dark:text-white dark:hover:bg-gray-800"
          >
            <MapPin size={20} strokeWidth={1.8} />
          </button>

          <button
            type="button"
            aria-label="Profile"
            className="ml-2 rounded-full text-gray-600 transition hover:text-gray-900 dark:text-white"
          >
            <UserCircle size={32} strokeWidth={1.6} />
          </button>

        </div>
      </div>
    </header>
  );
}

export default Navbar;