"use client";
import React, { useState } from "react";
import { Label } from "../components/accertinityUI/ui/label";
import { Input } from "../components/accertinityUI/ui/input";
import { cn } from "../lib/utils";
import {
  IconBrandGithub,
  IconBrandGoogle,
  IconBrandOnlyfans,
} from "@tabler/icons-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

interface SignupFormData {
  email: string;
  password: string;
}

export const SignupPage = () => {

  const navigate = useNavigate();
  const [formData, setFormData] = useState<SignupFormData>({
    email: "",
    password: "",
  });
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // console.log(formData);
      const response = await axios.post("/api/auth/register", formData);
      const data = response.data;
      console.log(response);
      if (!response.data) {
        throw new Error("SignUp failed");
      }

      if (data.token) {
        // Store the token in localStorage or a secure cookie
        localStorage.setItem("authToken", data.token);

        // Redirect to dashboard or home page
        navigate("/homepage");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred during login");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: string) => {
    try {
      // Redirect to backend social auth endpoint
      window.location.href = `/api/auth/${provider}`;
    } catch (err) {
      setError(`Failed to login with ${provider}`);
    }
  };
  return (
    <div className="min-h-screen flex bg-gray-900">
      {/* Left Section - Image Space */}
      <div className="hidden lg:flex lg:w-1/2 bg-black">
        {/* You can place your image here */}

      </div>

      {/* Right Section - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-black">

        <div className="max-w-md w-full mx-auto rounded-none md:rounded-2xl p-4 md:p-8 shadow-input bg-white dark:bg-black">
          <h2 className="flex justify-center font-bold text-3xl text-neutral-800 dark:text-neutral-200">
            Sign Up
          </h2>


          <form className="my-8" onSubmit={handleSubmit}>
            <LabelInputContainer className="mb-4">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" placeholder="abc@example.com" type="email" onChange={handleInputChange} required/>
            </LabelInputContainer>
            <LabelInputContainer className="mb-4">
              <Label htmlFor="password">Password</Label>
              <Input id="password" placeholder="••••••••" type="password" onChange={handleInputChange} required/>
            </LabelInputContainer>

            <button
              className={`bg-gradient-to-br relative group/btn from-black dark:from-zinc-900 dark:to-zinc-900 to-neutral-600 block dark:bg-zinc-800 w-full text-white rounded-xl h-10 font-medium shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] dark:shadow-[0px_1px_0px_0px_var(--zinc-800)_inset,0px_-1px_0px_0px_var(--zinc-800)_inset] ${isLoading ? "opacity-50 cursor-not-allowed" : ""
                }`}
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? "Registering..." : "Sign Up →"}
              <BottomGradient />
            </button>

            <div className="bg-gradient-to-r from-transparent via-neutral-300 dark:via-neutral-700 to-transparent my-8 h-[1px] w-full" />

            <div className="flex flex-col space-y-4">
            <button
                className=" relative group/btn flex space-x-2 items-center justify-start px-4 w-full text-black rounded-xl h-10 font-medium shadow-input bg-gray-50 dark:bg-zinc-900 dark:shadow-[0px_0px_1px_1px_var(--neutral-800)]"
                type="submit"
                onClick={() => handleSocialLogin("github")}
              >
                <IconBrandGithub className="h-4 w-4 text-neutral-800 dark:text-neutral-300" />
                <span className="text-neutral-700 dark:text-neutral-300 text-sm">
                  GitHub
                </span>
                <BottomGradient />
              </button>
              <button
                className=" relative group/btn flex space-x-2 items-center justify-start px-4 w-full text-black rounded-xl h-10 font-medium shadow-input bg-gray-50 dark:bg-zinc-900 dark:shadow-[0px_0px_1px_1px_var(--neutral-800)]"
                type="submit"
                onClick={() => handleSocialLogin("google")}
              >
                <IconBrandGoogle className="h-4 w-4 text-neutral-800 dark:text-neutral-300" />
                <span className="text-neutral-700 dark:text-neutral-300 text-sm">
                  Google
                </span>
                <BottomGradient />
              </button>
              <button
                className=" relative group/btn flex space-x-2 items-center justify-start px-4 w-full text-black rounded-xl h-10 font-medium shadow-input bg-gray-50 dark:bg-zinc-900 dark:shadow-[0px_0px_1px_1px_var(--neutral-800)]"
                type="submit"
                onClick={() => handleSocialLogin("onlyfans")}
              >
                <IconBrandOnlyfans className="h-4 w-4 text-neutral-800 dark:text-neutral-300" />
                <span className="text-neutral-700 dark:text-neutral-300 text-sm">
                  OnlyFans
                </span>
                <BottomGradient />
              </button>
              <span className="text-white">Already have an account ? <a href="/login" className="font-bold text-blue-500 hover:text-blue-400">Login</a></span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

const BottomGradient = () => {
  return (
    <>
      <span className="group-hover/btn:opacity-100 block transition duration-500 opacity-0 absolute h-px w-full -bottom-px inset-x-0 bg-gradient-to-r from-transparent via-cyan-500 to-transparent" />
      <span className="group-hover/btn:opacity-100 blur-sm block transition duration-500 opacity-0 absolute h-px w-1/2 mx-auto -bottom-px inset-x-10 bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />
    </>
  );
};

const LabelInputContainer = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={cn("flex flex-col space-y-2 w-full", className)}>
      {children}
    </div>
  );
};
