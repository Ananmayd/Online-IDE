import { Link } from 'react-router-dom'
import { HoverBorderGradient } from '../components/accertinityUI/ui/hover-border-gradient'
import { TypewriterEffect } from '../components/accertinityUI/ui/typewriter-effect'
import { words } from '../constants'

const landingPage = () => {
  return (
    <>
      <div className="h-[50rem] w-full dark:bg-black bg-white  dark:bg-grid-white/[0.2] bg-grid-black/[0.2] relative flex items-center justify-center">
        <div className="mr-30 absolute top-8 right-10 z-30 flex space-x-4">
          <HoverBorderGradient
            containerClassName="rounded-full"
            as="button"
            className="dark:bg-black bg-white text-black dark:text-white flex items-center space-x-2"
          >
            <Link to={'/signup'}>Sign Up</Link>
          </HoverBorderGradient>
          <HoverBorderGradient
            containerClassName="rounded-full"
            as="button"
            className="dark:bg-black bg-white text-black dark:text-white flex items-center space-x-2"
          >
            <Link to={'/login'}>Login</Link>
          </HoverBorderGradient>
        </div>

        <div className="flex flex-col items-center space-y-6 mb-20 pb-10">
          <div className="absolute pointer-events-none inset-0 flex justify-center dark:bg-black bg-white [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]">
          </div>
          <p className="text-4xl sm:text-7xl font-bold relative z-20 bg-clip-text text-transparent bg-gradient-to-b from-neutral-200 to-neutral-500">
            BuildIt !
          </p>

          <p className="relative z-20">
            <TypewriterEffect words={words} />
          </p>
        </div>
      </div>
      

    </>
  )
}

export default landingPage