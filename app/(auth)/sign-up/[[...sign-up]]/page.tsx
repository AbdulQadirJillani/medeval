import { SignUp } from "@clerk/nextjs"


const page = () => {
  return (
    <div className="flex justify-center items-center min-h-[calc(100svh-68px)]">
      <SignUp/>
    </div>
  )
}

export default page