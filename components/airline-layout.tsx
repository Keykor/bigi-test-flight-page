"use client"

import React from "react"
import Link from "next/link"
import Image from "next/image"
import { useSearchParams } from "next/navigation"

interface AirlineLayoutProps {
  children: React.ReactNode
  activeTab?: "flights" | "autoCheck" | "hotels" | "cars"
}

const AirlineLayout = ({ children, activeTab = "flights" }: AirlineLayoutProps) => {
  const searchParams = useSearchParams()
  const iterationId = searchParams.get("iteration") || ""

  return (
    <div className="min-h-screen flex flex-col">
      <header className="airline-header">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center">
            <h1 className="text-xl font-bold">airsomewhere</h1>
          </div>
          
          <nav className="airline-nav">
            <Link href="/" className="text-sm">Home</Link>
            <Link href={`/search?iteration=${iterationId}`} className="text-sm">Check In</Link>
            {/* Disabled links to avoid distraction */}
            <span className="text-sm text-gray-400 cursor-not-allowed">Services</span>
            <span className="text-sm text-gray-400 cursor-not-allowed">Terms</span>
            <span className="text-sm text-gray-400 cursor-not-allowed">Contact</span>
          </nav>
        </div>
        
        <div className="airline-tabs">
          <Link
            href={`/search?iteration=${iterationId}`}
            className={`airline-tab ${activeTab === "flights" ? "active" : ""}`}
          >
            <span className="flex items-center">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-5 w-5 mr-1" 
                viewBox="0 0 20 20" 
                fill="currentColor"
              >
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11.43a1 1 0 01.725-.962l5-1.429a1 1 0 001.17-1.409l-7-14z" />
              </svg>
              Flights
            </span>
          </Link>
          
          {/* Disabled tabs to avoid distraction */}
          <span className="airline-tab disabled cursor-not-allowed opacity-50">
            <span className="flex items-center">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-5 w-5 mr-1" 
                viewBox="0 0 20 20" 
                fill="currentColor"
              >
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Auto Check In
            </span>
          </span>
          
          <span className="airline-tab disabled cursor-not-allowed opacity-50">
            <span className="flex items-center">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-5 w-5 mr-1" 
                viewBox="0 0 20 20" 
                fill="currentColor"
              >
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
              </svg>
              Hotels
            </span>
          </span>
          
          <span className="airline-tab disabled cursor-not-allowed opacity-50">
            <span className="flex items-center">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-5 w-5 mr-1" 
                viewBox="0 0 20 20" 
                fill="currentColor"
              >
                <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H11a1 1 0 001-1v-1h3.05a2.5 2.5 0 014.9 0H19a1 1 0 001-1v-2a1 1 0 00-.293-.707l-2-2A1 1 0 0017 8h-3V5a1 1 0 00-1-1H3z" />
              </svg>
              Cars
            </span>
          </span>
        </div>
      </header>
      
      <main className="flex-grow">{children}</main>
      
      <footer className="bg-airline-darkgreen text-white py-4 mt-8">
        <div className="container mx-auto px-4 flex justify-between">
          <div>
            <p className="text-sm">airsomewhere © 2023</p>
          </div>
          <div>
            <p className="text-sm">Terms and Conditions | Contact Us</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default AirlineLayout
