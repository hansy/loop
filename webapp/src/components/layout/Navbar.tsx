"use client";

import React from "react";
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
} from "@headlessui/react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import { usePathname } from "next/navigation";

import { useAuth } from "@/contexts/AuthContext";
import Avatar from "@/components/ui/Avatar";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useAccount } from "wagmi";
import { truncateString } from "@/utils/truncateString";
import Link from "next/link";

const navigation = [{ name: "Dashboard", href: "/dashboard" }];

interface BaseUserNavigationItem {
  name: string;
}

interface UserNavigationLink extends BaseUserNavigationItem {
  href: string;
  type: "link";
}

interface UserNavigationAction extends BaseUserNavigationItem {
  action: () => void;
  type: "action";
}

interface UserNavigationDisplay extends BaseUserNavigationItem {
  type: "display";
}

type UserNavigationItem =
  | UserNavigationLink
  | UserNavigationAction
  | UserNavigationDisplay;

export default function Navbar() {
  const { isAuthenticated, login, logout, isAuthenticating } = useAuth();
  const { address: walletAddress, isConnected: isWalletConnected } =
    useAccount();
  const pathname = usePathname();

  const userNavigation = React.useMemo(() => {
    const items: UserNavigationItem[] = [];
    if (isWalletConnected && walletAddress) {
      items.push({
        name: truncateString(walletAddress, 6, 4),
        type: "display",
      });
    }
    items.push({ name: "Sign out", action: logout, type: "action" });
    return items;
  }, [isWalletConnected, walletAddress, logout]);

  return (
    <Disclosure as="nav" className="bg-gray-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          <div className="flex">
            <div className="mr-2 -ml-2 flex items-center md:hidden">
              <DisclosureButton className="group relative inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-700 hover:text-white focus:ring-2 focus:ring-white focus:outline-none focus:ring-inset">
                <span className="absolute -inset-0.5" />
                <span className="sr-only">Open main menu</span>
                <Bars3Icon
                  aria-hidden="true"
                  className="block size-6 group-data-[open]:hidden"
                />
                <XMarkIcon
                  aria-hidden="true"
                  className="hidden size-6 group-data-[open]:block"
                />
              </DisclosureButton>
            </div>
            <div className="flex flex-shrink-0 items-center">
              <Link href="/" className="text-white text-2xl font-bold">
                LOOP
              </Link>
            </div>
            <div className="hidden md:ml-6 md:flex md:items-center md:space-x-4">
              {isAuthenticated &&
                navigation.map((item) => {
                  const isCurrent = item.href === pathname;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      aria-current={isCurrent ? "page" : undefined}
                      className={`${
                        isCurrent
                          ? "bg-gray-900 text-white"
                          : "text-gray-300 hover:bg-gray-700 hover:text-white"
                      } rounded-md px-3 py-2 text-sm font-medium`}
                    >
                      {item.name}
                    </Link>
                  );
                })}
            </div>
          </div>
          <div className="flex items-center">
            <div className="hidden md:ml-4 md:flex md:shrink-0 md:items-center">
              {isAuthenticating ? (
                <LoadingSpinner className="h-6 w-6 border-b-2 border-gray-400" />
              ) : isAuthenticated ? (
                <Menu as="div" className="relative ml-3">
                  <div>
                    <MenuButton className="relative flex items-center rounded-full bg-gray-800 text-sm focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800 focus:outline-none">
                      <span className="absolute -inset-1.5" />
                      <span className="sr-only">Open user menu</span>
                      <Avatar
                        username={walletAddress}
                        className="size-8 rounded-full"
                        saturation="50"
                        lightness="50"
                      />
                    </MenuButton>
                  </div>
                  <MenuItems
                    transition
                    className="absolute right-0 z-10 mt-2 w-auto min-w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black/5 transition focus:outline-none data-[closed]:scale-95 data-[closed]:transform data-[closed]:opacity-0 data-[enter]:duration-200 data-[enter]:ease-out data-[leave]:duration-75 data-[leave]:ease-in"
                  >
                    {userNavigation.map((item) => (
                      <MenuItem
                        key={item.name}
                        disabled={item.type === "display"}
                      >
                        {({ active, disabled }) => {
                          if (item.type === "display") {
                            return (
                              <span className="block px-4 py-2 text-sm text-gray-500 cursor-default">
                                {item.name}
                              </span>
                            );
                          } else if (item.type === "action") {
                            return (
                              <button
                                onClick={item.action}
                                className={`${
                                  active && !disabled ? "bg-gray-100" : ""
                                } block w-full text-left px-4 py-2 text-sm text-gray-700`}
                              >
                                {item.name}
                              </button>
                            );
                          } else {
                            return (
                              <a
                                href={item.href}
                                className={`${
                                  active && !disabled ? "bg-gray-100" : ""
                                } block px-4 py-2 text-sm text-gray-700`}
                              >
                                {item.name}
                              </a>
                            );
                          }
                        }}
                      </MenuItem>
                    ))}
                  </MenuItems>
                </Menu>
              ) : (
                <button
                  onClick={login}
                  className="ml-6 inline-flex items-center rounded-md bg-indigo-500 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
                >
                  Log In / Sign Up
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <DisclosurePanel className="md:hidden">
        {isAuthenticated ? (
          <>
            <div className="space-y-1 px-2 pt-2 pb-3 sm:px-3">
              {navigation.map((item) => {
                const isCurrent = item.href === pathname;
                return (
                  <DisclosureButton
                    key={item.name}
                    as="a"
                    href={item.href}
                    aria-current={isCurrent ? "page" : undefined}
                    className={`${
                      isCurrent
                        ? "bg-gray-900 text-white"
                        : "text-gray-300 hover:bg-gray-700 hover:text-white"
                    } block rounded-md px-3 py-2 text-base font-medium`}
                  >
                    {item.name}
                  </DisclosureButton>
                );
              })}
            </div>
            <div className="border-t border-gray-700 pt-4 pb-3">
              <div className="flex items-center px-5 sm:px-6">
                <div className="shrink-0">
                  <Avatar
                    username={walletAddress}
                    className="size-10 rounded-full"
                    saturation="50"
                    lightness="50"
                  />
                </div>
                <div className="ml-3">
                  <div className="text-base font-medium text-white">
                    {truncateString(walletAddress, 6, 4)}
                  </div>
                </div>
              </div>
              <div className="mt-3 space-y-1 px-2 sm:px-3">
                {userNavigation
                  .filter((navItem) => navItem.type !== "display")
                  .map((navItem) => {
                    if (navItem.type === "action") {
                      return (
                        <DisclosureButton
                          key={navItem.name}
                          as="button"
                          onClick={navItem.action}
                          className="block w-full text-left rounded-md px-3 py-2 text-base font-medium text-gray-400 hover:bg-gray-700 hover:text-white"
                        >
                          {navItem.name}
                        </DisclosureButton>
                      );
                    }
                    const linkItem = navItem as UserNavigationLink;
                    return (
                      <DisclosureButton
                        key={linkItem.name}
                        as="a"
                        href={linkItem.href}
                        className="block rounded-md px-3 py-2 text-base font-medium text-gray-400 hover:bg-gray-700 hover:text-white"
                      >
                        {linkItem.name}
                      </DisclosureButton>
                    );
                  })}
              </div>
            </div>
          </>
        ) : !isAuthenticating ? (
          <div className="px-2 pt-2 pb-3 sm:px-3">
            <DisclosureButton
              as="button"
              onClick={login}
              className="block w-full text-left rounded-md bg-indigo-500 px-3 py-2 text-base font-medium text-white hover:bg-indigo-400"
            >
              Log In / Sign Up
            </DisclosureButton>
          </div>
        ) : null}
      </DisclosurePanel>
    </Disclosure>
  );
}
