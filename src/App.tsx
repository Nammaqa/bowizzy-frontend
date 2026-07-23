import React, { useEffect, useState } from "react";
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import Home from "./pages/Home";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import WelcomeBonusManager from "./components/WelcomeBonusManager";
import {
  Sidebar,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "./components/ui/sidebar";
import Bowizzy from "@/assets/bowizzy.png";
import {
  Box,
  Coins,
  Crown,
  FileArchive,
  LayoutDashboard,
  Linkedin,
  LogOut,
  MessageSquare,
  Phone,
  User,
  Video,
  BrainCircuit,
  ChevronDown,
  Globe,
  Settings as SettingsIcon,
} from "lucide-react";

import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import ResumeBuilder from "./pages/ResumeBuilder";
import LinkedInOptimization from "./pages/LinkedInOptimization";
import InterviewPrep from "./pages/InterviewPrep";
import InterviewPrepSelection from "./pages/(InterviewPrep)/InterviewPrepSelection";
import MockInterview from "./pages/(InterviewPrep)/MockInterview";
import GiveMockInterview from "./pages/(InterviewPrep)/GiveMockInterview";
import InterviewDetails from "./pages/(InterviewPrep)/InterviewDetails";
import CandidateInformationConnect from "./pages/(InterviewPrep)/CandidateInformationConnect";
import InterviewerEvaluation from "./pages/(InterviewPrep)/InterviewerEvaluation";
import CandidateEvaluation from "./pages/(InterviewPrep)/CandidateEvaluation";
import TakeMockInterview from "./pages/(InterviewPrep)/TakeMockInterview";
import ProfileForm from "./pages/(Profile)/ProfileForms";
import ParsingSteps from "./pages/(Profile)/components/ParsingSteps";
import VideoPractice from "./pages/(InterviewPrep)/VideoPractise/VideoPractice";
import { getProfileProgress } from "./services/dashboardServices";
import InterviewSteps from "./pages/(InterviewPrep)/VideoPractise/Components/InterviewSteps";
import InterviewQuestion from "./pages/(InterviewPrep)/VideoPractise/Components/InterviewQuestion";
import InterviewComplete from "./pages/(InterviewPrep)/VideoPractise/Components/InterviewComplete";
import InterviewReview from "./pages/(InterviewPrep)/VideoPractise/Components/InterviewReview";
import TemplateSelection from "./pages/(ResumeBuilder)/TemplateSelection";
import ResumeEditor from "./pages/(ResumeBuilder)/ResumeEditor";
import Credits from "./pages/Credits";
import AiResumeLanding from "./pages/AiResumeLanding";
import AIBuilder from "./pages/(AIResumeBuilder)/AiBuilder";
import Terms from "./pages/terms";
import PrivacyPolicy from "./pages/privacy-policy";
import CreatePortfolio from "./pages/(Portfolio)/CreatePortfolio";
import PortfolioList from "./pages/(Portfolio)/PortfolioList";
import PortfolioLanding from "./pages/PortfolioLanding";
import PortfolioEditor from "./pages/(Portfolio)/PortfolioEditor";
import PublicPortfolioPreview from "./pages/(Portfolio)/PublicPortfolioPreview";
import MockInterviewLanding from "./pages/(Interviews)/MockInterview/MockInterviewLanding";
import TakeMockInterviewPage from "./pages/(Interviews)/MockInterview/TakeMockInterviewPage";
import MockInterviewBookingsPage from "./pages/(Interviews)/MockInterview/MockInterviewBookingsPage";
import ApplyInterviewerPage from "./pages/(Interviews)/MockInterview/ApplyInterviewerPage";
import InterviewerDashboardPage from "./pages/(Interviews)/MockInterview/InterviewerDashboardPage";
import CandidateReviewsPage from "./pages/(Interviews)/MockInterview/CandidateReviewsPage";
import InterviewerReviewsPage from "./pages/(Interviews)/MockInterview/InterviewerReviewsPage";


const isAuthenticated = () => {
  const raw = localStorage.getItem("user");
  if (!raw) return false;
  try {
    const parsed = JSON.parse(raw);
    return !!parsed?.token;
  } catch {
    return false;
  }
};

/**
 * Shared logout function — floods the history stack with /login entries so
 * ALL old session pages are buried, then does a hard reload at /login.
 * This is the web equivalent of navigation.reset({ index:0, routes:[{name:'Login'}] }).
 */
function clearHistoryAndLogout() {
  try {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  } catch { /* ignore */ }

  // Replace current entry with /login, then push enough /login entries
  // to completely bury every old history entry the user may have visited.
  const depth = window.history.length + 10;
  window.history.replaceState(null, "", "/login");
  for (let i = 0; i < depth; i++) {
    window.history.pushState(null, "", "/login");
  }

  // Hard reload — React + React Router restart completely fresh at /login.
  window.location.reload();
}

/**
 * Global guard: intercepts any back/forward press and, if the user is no
 * longer authenticated, does a hard redirect to /login instead of letting
 * React Router render a stale protected page.
 * Also handles bfcache restoration (event.persisted) so the frozen DOM is
 * never shown to an unauthenticated user.
 */
function AuthPopstateGuard() {
  useEffect(() => {
    // Sentinel push so the very first back-press is also interceptable.
    window.history.pushState(null, "", window.location.href);

    const handlePopState = () => {
      if (!isAuthenticated()) {
        window.location.replace("/login");
      }
    };

    // pageshow fires when bfcache restores a frozen page — JS never ran on
    // restore, so this is the only reliable hook for that case.
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted && !isAuthenticated()) {
        window.location.replace("/login");
      }
    };

    window.addEventListener("popstate", handlePopState);
    window.addEventListener("pageshow", handlePageShow);
    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, []);

  return null;
}

// Only show Profile & My resumes for now. Remaining items are hidden as requested. (okna)
const careerMap = [
  {
    href: "/profile",
    icon: <User color="#3B3B3B" size={16} />,
    label: "Profile 1",
  },
  {
    href: "/ResumeBuilder",
    icon: <FileArchive color="#3B3B3B" size={16} />,
    label: "My resumes",
  },
  {
    href: "/ai-resume-builder",
    icon: <BrainCircuit color="#3B3B3B" size={16} />,
    label: "AI Resume Builder",
  },
  {
    href: "/portfolio",
    icon: <Globe color="#3B3B3B" size={16} />,
    label: "Portfolio",
  },
  // {
  //   href: "/linkedin-optimization",
  //   icon: <Linkedin color="#3B3B3B" size={16} />,
  //   label: "LinkedIn optimization",
  // },
];

const interviews = [
  {
    href: "/interviews/mock-interview",
    label: "Mock interview",
  },
];

// All Bowizzy items hidden for now as requested.
const bowizzy = [
  // {
  //   href: "/digital-product",
  //   icon: <Box color="#3B3B3B" size={16} />,
  //   label: "Digital product",
  // },
  // {
  //   href: "/premium",
  //   icon: <Crown color="#3B3B3B" size={16} />,
  //   label: "Go premium",
  // },
  // {
  //   href: "/feeedback",
  //   icon: <MessageSquare color="#3B3B3B" size={16} />,
  //   label: "Feedback",
  // },
];

function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isInterviewsOpen, setIsInterviewsOpen] = useState(
    location.pathname.startsWith("/interviews") ||
    location.pathname.startsWith("/interview-prep")
  );

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("user"));
    const userId = userData?.user_id;
    const token = userData?.token;

    if (userId && token) {
      getProfileProgress(userId, token)
        .catch((error) => {
          if (error.response?.status === 401) {
            clearHistoryAndLogout();
          }
        });
    }
  }, []);

  const isPortfolioEditor = location.pathname.includes("/portfolio/editor/");

  return (
    <SidebarProvider>
      <WelcomeBonusManager />
      {!isPortfolioEditor && (
        <Sidebar className="overflow-y-auto z-50">
          <SidebarHeader>
            <div className="flex items-center justify-center p-6">
              <img src={Bowizzy} alt="Bowizzard Logo" />
            </div>
          </SidebarHeader>

          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem key={"Dashboard"}>
                  <SidebarMenuButton asChild className="p-5 flex items-center">
                    <a href={"/dashboard"}>
                      <LayoutDashboard color="#3B3B3B" size={16} />
                      <span className="ml-4" style={{ fontSize: "14px" }}>
                        Dashboard
                      </span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel className="p-5">Career</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {careerMap.map((item, idx) => (
                  <SidebarMenuButton
                    asChild
                    className="p-5 flex items-center"
                    key={item.label + idx}
                  >
                    <a
                      href={item.href}
                    // onClick={(e) => {
                    //   if ((item as any).comingSoon) {
                    //     e.preventDefault();
                    //     alert("Coming Soon!");
                    //   }
                    // }}
                    >
                      {item.icon}
                      <span className="ml-4" style={{ fontSize: "14px" }}>
                        {item.label}
                      </span>
                    </a>
                  </SidebarMenuButton>
                ))}
                <SidebarMenuItem>
                  <SidebarMenuButton
                    className="p-5 flex items-center justify-between"
                    onClick={() => setIsInterviewsOpen((isOpen) => !isOpen)}
                  >
                    <span className="flex items-center">
                      <Video color="#3B3B3B" size={16} />
                      <span className="ml-4" style={{ fontSize: "14px" }}>
                        Interviews
                      </span>
                    </span>
                    <ChevronDown
                      color="#3B3B3B"
                      size={16}
                      className={`transition-transform ${isInterviewsOpen ? "rotate-180" : ""}`}
                    />
                  </SidebarMenuButton>

                  {isInterviewsOpen && (
                    <div className="ml-9 mt-1 space-y-1 border-l border-[#E5E5E5] pl-3">
                      {interviews.map((item) => (
                        <SidebarMenuButton
                          asChild
                          key={item.label}
                          className="h-9 px-3 text-[#3B3B3B]"
                        >
                          <a href={item.href}>
                            <span style={{ fontSize: "13px" }}>{item.label}</span>
                          </a>
                        </SidebarMenuButton>
                      ))}
                    </div>
                  )}
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/*
          <SidebarGroup>
            <SidebarGroupLabel className="p-5">Bowizzy</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {bowizzy.map((item, idx) => (
                  <SidebarMenuButton
                    asChild
                    className="p-5 flex items-center"
                    key={item.label + idx}
                  >
                    <a href={item.href}>
                      {item.icon}
                      <span className="ml-4" style={{ fontSize: "14px" }}>
                        {item.label}
                      </span>
                    </a>
                  </SidebarMenuButton>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          */}

          <SidebarFooter className="mt-auto mb-4">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  className="p-5 flex items-center"
                >
                  <a href="/credits">
                    <Coins color="#3B3B3B" size={16} />
                    <span className="ml-4" style={{ fontSize: "14px" }}>
                      Credits
                    </span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  className="p-5 flex items-center"
                >
                  <a href="/settings">
                    <SettingsIcon color="#3B3B3B" size={16} />
                    <span className="ml-4" style={{ fontSize: "14px" }}>
                      Settings
                    </span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  className="p-5 flex items-center border-2 border-[#FF0000]"
                  onClick={(e) => {
                    e.preventDefault();
                    clearHistoryAndLogout();
                  }}
                >
                  <LogOut color="#FF0000" size={16} />
                  <span
                    className="ml-4"
                    style={{ fontSize: "14px", color: "#FF0000" }}
                  >
                    Logout
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>
      )}

      <main className="bg-[#F0F0F0] min-h-screen flex-1">{children}</main>
    </SidebarProvider>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  if (isAuthenticated()) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}

function App() {
  const router = createBrowserRouter([
    {
      path: "/",
      Component: () => {
        if (isAuthenticated()) {
          return <Navigate to="/dashboard" replace />;
        }
        return <Navigate to="/login" replace />;
      },
    },
    {
      path: "login",
      Component: () => (
        <PublicOnlyRoute>
          <Login />
        </PublicOnlyRoute>
      ),
    },
    {
      path: "signup",
      Component: () => <Register />,
    },
    {
      path: "forgot-password",
      Component: () => (
        <PublicOnlyRoute>
          <ForgotPassword />
        </PublicOnlyRoute>
      ),
    },
    {
      path: "dashboard",
      Component: () => (
        <ProtectedRoute>
          <LayoutWrapper>
            <Dashboard />
          </LayoutWrapper>
        </ProtectedRoute>
      ),
    },
    {
      path: "profile",
      Component: () => (
        <ProtectedRoute>
          <LayoutWrapper>
            <Profile />
          </LayoutWrapper>
        </ProtectedRoute>
      ),
    },
    {
      path: "ai-resume-builder",
      Component: () => (
        <ProtectedRoute>
          <LayoutWrapper>
            <AiResumeLanding />
          </LayoutWrapper>
        </ProtectedRoute>
      ),
    },
    {
      path: "ai-resume-builder/chat",
      Component: () => (
        <ProtectedRoute>
          <LayoutWrapper>
            <AIBuilder />
          </LayoutWrapper>
        </ProtectedRoute>
      ),
    },
    {
      path: "linkedin-optimization",
      Component: () => (
        <ProtectedRoute>
          <LayoutWrapper>
            <LinkedInOptimization />
          </LayoutWrapper>
        </ProtectedRoute>
      ),
    },
    {
      path: "interview-prep",
      Component: () => (
        <ProtectedRoute>
          <LayoutWrapper>
            <InterviewPrep />
          </LayoutWrapper>
        </ProtectedRoute>
      ),
    },
    {
      path: "interviews/mock-interview",
      Component: () => (
        <ProtectedRoute>
          <LayoutWrapper>
            <MockInterviewLanding />
          </LayoutWrapper>
        </ProtectedRoute>
      ),
    },
    {
      path: "interviews/mock-interview/take",
      Component: () => (
        <ProtectedRoute>
          <LayoutWrapper>
            <TakeMockInterviewPage />
          </LayoutWrapper>
        </ProtectedRoute>
      ),
    },
    {
      path: "interviews/mock-interview/bookings",
      Component: () => (
        <ProtectedRoute>
          <LayoutWrapper>
            <MockInterviewBookingsPage />
          </LayoutWrapper>
        </ProtectedRoute>
      ),
    },
    {
      path: "interviews/mock-interview/apply-interviewer",
      Component: () => (
        <ProtectedRoute>
          <LayoutWrapper>
            <ApplyInterviewerPage />
          </LayoutWrapper>
        </ProtectedRoute>
      ),
    },
    {
      path: "interviews/mock-interview/dashboard",
      Component: () => (
        <ProtectedRoute>
          <LayoutWrapper>
            <InterviewerDashboardPage />
          </LayoutWrapper>
        </ProtectedRoute>
      ),
    },
    {
      path: "interviews/mock-interview/candidate-reviews/:id",
      Component: () => (
        <ProtectedRoute>
          <LayoutWrapper>
            <CandidateReviewsPage />
          </LayoutWrapper>
        </ProtectedRoute>
      ),
    },
    {
      path: "interviews/mock-interview/interviewer-reviews/:id",
      Component: () => (
        <ProtectedRoute>
          <LayoutWrapper>
            <InterviewerReviewsPage />
          </LayoutWrapper>
        </ProtectedRoute>
      ),
    },
    {
      path: "interview-prep/select",
      Component: () => (
        <ProtectedRoute>
          <LayoutWrapper>
            <InterviewPrepSelection />
          </LayoutWrapper>
        </ProtectedRoute>
      ),
    },
    {
      path: "interview-prep/mock-interview",
      Component: () => (
        <ProtectedRoute>
          <LayoutWrapper>
            <MockInterview />
          </LayoutWrapper>
        </ProtectedRoute>
      ),
    },
    {
      path: "interview-prep/video-practice",
      Component: () => (
        <ProtectedRoute>
          <LayoutWrapper>
            <VideoPractice />
          </LayoutWrapper>
        </ProtectedRoute>
      ),
    },
    {
      path: "interview-prep/video-practice/steps",
      Component: () => (
        <ProtectedRoute>
          <LayoutWrapper>
            <InterviewSteps />
          </LayoutWrapper>
        </ProtectedRoute>
      ),
    },
    {
      path: "interview-prep/video-practice/question",
      Component: () => (
        <ProtectedRoute>
          <LayoutWrapper>
            <InterviewQuestion />
          </LayoutWrapper>
        </ProtectedRoute>
      ),
    },
    {
      path: "interview-prep/video-practice/complete",
      Component: () => (
        <ProtectedRoute>
          <LayoutWrapper>
            <InterviewComplete />
          </LayoutWrapper>
        </ProtectedRoute>
      ),
    },
    {
      path: "interview-prep/video-practice/review",
      Component: () => (
        <ProtectedRoute>
          <LayoutWrapper>
            <InterviewReview />
          </LayoutWrapper>
        </ProtectedRoute>
      ),
    },
    {
      path: "interview-prep/give-mock-interview",
      Component: () => (
        <ProtectedRoute>
          <LayoutWrapper>
            <GiveMockInterview />
          </LayoutWrapper>
        </ProtectedRoute>
      ),
    },

    {
      path: "interview-prep/pay/:slotId",
      Component: () => (
        <ProtectedRoute>
          <LayoutWrapper>
            <GiveMockInterview />
          </LayoutWrapper>
        </ProtectedRoute>
      ),
    },
    {
      path: "interview-prep/interview-details/:id",
      Component: () => (
        <ProtectedRoute>
          <LayoutWrapper>
            <InterviewDetails />
          </LayoutWrapper>
        </ProtectedRoute>
      ),
    },
    // {
    //   path: "interview-prep/candidate-information-connect",
    //   Component: () => (
    //     <ProtectedRoute>
    //       <LayoutWrapper>
    //         <CandidateInformationConnect />
    //       </LayoutWrapper>
    //     </ProtectedRoute>
    //   ),
    // },
    {
      path: "interview-prep/interviewer-evaluation/:scheduleId",
      Component: () => (
        <ProtectedRoute>
          <LayoutWrapper>
            <InterviewerEvaluation />
          </LayoutWrapper>
        </ProtectedRoute>
      ),
    },
    {
      path: "interview-prep/candidate-evaluation/:scheduleId",
      Component: () => (
        <ProtectedRoute>
          <LayoutWrapper>
            <CandidateEvaluation />
          </LayoutWrapper>
        </ProtectedRoute>
      ),
    },
    {
      path: "interview-prep/take-mock-interview",
      Component: () => (
        <ProtectedRoute>
          <LayoutWrapper>
            <TakeMockInterview />
          </LayoutWrapper>
        </ProtectedRoute>
      ),
    },
    {
      path: "profile/form",
      Component: () => (
        <ProtectedRoute>
          <LayoutWrapper>
            <ProfileForm />
          </LayoutWrapper>
        </ProtectedRoute>
      ),
    },
    {
      path: "profile/parsing",
      Component: () => (
        <ProtectedRoute>
          <LayoutWrapper>
            <ParsingSteps />
          </LayoutWrapper>
        </ProtectedRoute>
      ),
    },
    {
      path: "ResumeBuilder",
      Component: () => (
        <ProtectedRoute>
          <LayoutWrapper>
            <ResumeBuilder />
          </LayoutWrapper>
        </ProtectedRoute>
      ),
    },
    {
      path: "template-selection",
      Component: () => (
        <ProtectedRoute>
          <LayoutWrapper>
            <TemplateSelection />
          </LayoutWrapper>
        </ProtectedRoute>
      )
    },
    {
      path: "resume-editor",
      Component: () => (
        <ProtectedRoute>
          <LayoutWrapper>
            <ResumeEditor />
          </LayoutWrapper>
        </ProtectedRoute>
      )
    },
    {
      path: "credits",
      Component: () => (
        <ProtectedRoute>
          <LayoutWrapper>
            <Credits />
          </LayoutWrapper>
        </ProtectedRoute>
      )
    },
    {
      path: "settings",
      Component: () => (
        <ProtectedRoute>
          <LayoutWrapper>
            <Settings />
          </LayoutWrapper>
        </ProtectedRoute>
      )
    },
    {
      path: "terms",
      Component: () => <Terms />
    },
    {
      path: "privacy-policy",
      Component: () => <PrivacyPolicy />
    },
    {
      path: "portfolio",
      Component: () => (
        <ProtectedRoute>
          <LayoutWrapper>
            <PortfolioLanding />
          </LayoutWrapper>
        </ProtectedRoute>
      ),
    },
    {
      path: "portfolio/list",
      Component: () => (
        <ProtectedRoute>
          <LayoutWrapper>
            <PortfolioList />
          </LayoutWrapper>
        </ProtectedRoute>
      ),
    },
    {
      path: "portfolio/create",
      Component: () => (
        <ProtectedRoute>
          <LayoutWrapper>
            <CreatePortfolio />
          </LayoutWrapper>
        </ProtectedRoute>
      ),
    },
    {
      path: "portfolio/editor/:id",
      Component: () => (
        <ProtectedRoute>
          <LayoutWrapper>
            <PortfolioEditor />
          </LayoutWrapper>
        </ProtectedRoute>
      ),
    },
    {
      path: "portfolio-preview/:porfolioid",
      Component: () => <PublicPortfolioPreview />,
    },
    {
      path: "portfolio-preview/:portfolioid",
      Component: () => <PublicPortfolioPreview />,
    },
  ]);

  return (
    <>
      {/* Always-on guard: equivalent of navigation.reset() on logout */}
      <AuthPopstateGuard />
      <RouterProvider router={router} />
    </>
  );
}

export default App;
