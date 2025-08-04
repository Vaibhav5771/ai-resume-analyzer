import type { Route } from "./+types/home";
import NavBar from "~/components/NavBar";
import { resumes } from "../../constants";
import ResumeCard from "~/components/ResumeCard";
import {useEffect} from "react";
import {useLocation, useNavigate} from "react-router";
import {usePuterStore} from "~/lib/puter";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Resumind" },
    { name: "description", content: "Smart feedback for your dream job!" },
  ];
}

export default function Home() {
    const {  auth } = usePuterStore();
    const navigate = useNavigate();

    useEffect(() => {
        if(!auth.isAuthenticated) navigate('/auth?next=/');
    }, [auth.isAuthenticated])

  return (
    <main className="bg-[url('/images/bg-main.svg')] bg-cover min-h-screen">
      <NavBar />
      <section className="main-section">
        <div className="page-heading py-16">
          <h1>Track Your Application & Resume Ratings</h1>
          <h2>Review your submissions and check AI-powered feedback.</h2>
        </div>
        {resumes.length > 0 ? (
          <div className="resumes-section container mx-auto flex flex-wrap max-md:flex-col max-md:gap-4 gap-6 items-center max-md:items-center justify-center w-full max-w-[1850px] p-4">
            {resumes.map((resume) => (
              <ResumeCard key={resume.id} resume={resume} />
            ))}
          </div>
        ) : (
          <div className="resumes-section container mx-auto p-4 text-center">
            <p>No resumes found. Start by adding one!</p>
          </div>
        )}
      </section>
    </main>
  );
}