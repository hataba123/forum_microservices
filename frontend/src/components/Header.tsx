import { Disclosure, Menu } from "@headlessui/react";
import LoginModal from "./LoginModal";
import { useState } from "react";

import {
  Bars3Icon,
  XMarkIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import { Link } from "react-router-dom";
/**
 * Header component for VOZ Clone website.
 * - Includes responsive navigation bar
 * - Dropdown menu for "Latests"
 * - Mobile support with collapsible panel
 */
export default function Header() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  return (
    <Disclosure
      as="nav"
      className=" bg-linear-to-r from-blue-950 to-blue-800 text-white shadow-md"
    >
      {({ open }) => (
        <>
          {/* ======= Top Navigation Bar (Desktop) ======= */}
          <div className="mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex h-18 items-center ">
              {/* ==== Left: Logo + Navigation Links ==== */}
              <div className="flex items-center space-x-4">
                {/* === Mobile Menu Toggle Button === */}
                <div className="md:hidden">
                  <Disclosure.Button className="inline-flex items-center justify-center p-2 rounded-md hover:bg-blue-500 focus:outline-none">
                    {open ? (
                      <XMarkIcon className="h-6 w-6 text-white" />
                    ) : (
                      <Bars3Icon className="h-6 w-6 text-white" />
                    )}
                  </Disclosure.Button>
                </div>

                {/* === Logo (Desktop Only) === */}
                <h1 className="font-bold text-xl text-white hidden md:block">
                  <a href="/">
                    <img
                      src="logo_voz.png"
                      alt="Girl in a jacket"
                      width="84"
                      height="45"
                    />
                  </a>
                </h1>

                {/* === Desktop Navigation Links === */}
                <div className="hidden md:flex space-x-4">
                  {/* Forums link */}
                  <Link
                    to="/"
                    className="text-white hover:bg-blue-500 px-3 py-2 rounded-md"
                  >
                    Forums
                  </Link>

                  {/* Dropdown for Latests */}
                  <Menu as="div" className="relative">
                    <Menu.Button className="flex items-center text-white hover:bg-blue-500 px-3 py-2 rounded-md">
                      Latests
                      <ChevronDownIcon className="ml-1 h-4 w-4" />
                    </Menu.Button>

                    {/* Dropdown Panel */}
                    <Menu.Items className="absolute left-0 mt-2 w-48 bg-blue-600 rounded-md shadow-lg z-10">
                      <Menu.Item>
                        {({ active }) => (
                          <Link
                            to="/latest-posts"
                            className={`block px-4 py-2 text-white ${
                              active ? "bg-blue-500" : ""
                            }`}
                          >
                            Latest Posts
                          </Link>
                        )}
                      </Menu.Item>
                      <Menu.Item>
                        {({ active }) => (
                          <Link
                            to="/latest-threads"
                            className={`block px-4 py-2 text-white ${
                              active ? "bg-blue-500" : ""
                            }`}
                          >
                            Latest Threads
                          </Link>
                        )}
                      </Menu.Item>
                      <Menu.Item>
                        {({ active }) => (
                          <Link
                            to="/trending"
                            className={`block px-4 py-2 text-white ${
                              active ? "bg-blue-500" : ""
                            }`}
                          >
                            Trending Today
                          </Link>
                        )}
                      </Menu.Item>
                    </Menu.Items>
                  </Menu>
                </div>
              </div>

              <div className="hidden md:flex space-x-2 ml-auto">
                <button
                  onClick={() => setIsLoginOpen(true)}
                  className="text-white hover:bg-blue-500 px-3 py-2 rounded-md"
                >
                  Log in
                </button>
                <Link
                  to="/register"
                  className="text-white hover:bg-blue-500 px-3 py-2 rounded-md"
                >
                  Register
                </Link>
              </div>
              {/* Modal hiển thị nếu click "Log in" */}
              <LoginModal
                isOpen={isLoginOpen}
                onClose={() => setIsLoginOpen(false)}
              />
            </div>
          </div>
          {/* ======= Mobile Navigation Panel ======= */}
          <Disclosure.Panel className="md:hidden px-4 pb-3 space-y-1">
            {/* Forums link */}
            <Link
              to="/threads"
              className="block px-3 py-2 rounded-md hover:bg-blue-500 text-white"
            >
              Forums
            </Link>

            {/* Mobile Dropdown: Latests */}
            <Menu as="div" className="relative bg-transparent">
              {/* Dropdown Button */}
              <Menu.Button className="flex w-full items-center justify-between px-3 py-2 rounded-md hover:bg-blue-500 text-white">
                Latests
                <ChevronDownIcon className="ml-2 h-4 w-4" />
              </Menu.Button>

              {/* Dropdown Items (Mobile) */}
              <Menu.Items className="mt-1 w-full bg-blue-600 rounded-md space-y-1 z-10">
                <Menu.Item>
                  {({ active }) => (
                    <Link
                      to="/latest-posts"
                      className={`block px-4 py-2 text-white rounded-md ${
                        active ? "bg-blue-500" : ""
                      }`}
                    >
                      Latest Posts
                    </Link>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <Link
                      to="/latest-threads"
                      className={`block px-4 py-2 text-white rounded-md ${
                        active ? "bg-blue-500" : ""
                      }`}
                    >
                      Latest Threads
                    </Link>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <Link
                      to="/trending"
                      className={`block px-4 py-2 text-white rounded-md ${
                        active ? "bg-blue-500" : ""
                      }`}
                    >
                      Trending Today
                    </Link>
                  )}
                </Menu.Item>
              </Menu.Items>
            </Menu>

            {/* Auth buttons for mobile */}
            <div className="border-t border-blue-500 pt-3">
              <Link
                to="/login"
                className="block px-3 py-2 rounded-md hover:bg-blue-500 text-white"
              >
                Log in
              </Link>
              <Link
                to="/register"
                className="block px-3 py-2 rounded-md hover:bg-blue-500 text-white"
              >
                Register
              </Link>
            </div>
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
}
