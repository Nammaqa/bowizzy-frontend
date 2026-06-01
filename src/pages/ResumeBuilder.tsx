import { useEffect, useState } from "react";
import DashNav from "@/components/dashnav/dashnav";
import { useNavigate } from "react-router-dom";
import { getAllTemplates, getTemplateById } from "@/templates/templateRegistry";
import {
  getResumeTemplates,
  deleteResumeTemplate,
} from "@/services/resumeServices";
import { uploadResume } from "@/services/resumeServices";

export default function ResumeBuilder() {
  const navigate = useNavigate();
  const templates = getAllTemplates();

  const [userResumes, setUserResumes] = useState<any[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoadingTemplates(true);
        const userStr = localStorage.getItem("user");
        if (!userStr) return;
        const user = JSON.parse(userStr);
        const userId = user.user_id;
        const token = user.token;

        const data = await getResumeTemplates(userId, token);

        const isValidThumbnail = (u: any) =>
          typeof u === "string" && (u.startsWith("http") || u.startsWith("/") || u.startsWith("data:"));

        const mapped = data.map((t) => {

          let thumbnailCandidate = t.thumbnail_url || t.thumbnail || null;
          let thumbnail = null;
          if (isValidThumbnail(thumbnailCandidate)) thumbnail = thumbnailCandidate;

          if (!thumbnail && t.template_id) {
            const reg = getTemplateById(t.template_id);
            thumbnail = reg?.thumbnail || null;
          }

          if (!thumbnail) {
            thumbnail = '/placeholder-resume-thumb.png'; // placeholder in public/
          }

          return {
            id: t.resume_template_id,
            template_id: t.template_id,
            thumbnail,
            pdfUrl: t.template_file_url || t.template_file_url || t.file_url || null,
            name: t.template_name || t.name || `Resume ${t.resume_template_id}`,
          };
        });
        setUserResumes(mapped);
      } catch (err) {
        console.error("Error loading resume templates:", err);
      } finally {
        setLoadingTemplates(false);
      }
    };
    load();
  }, []);

  const handleNewResume = () => {
    navigate('/template-selection');
  };

  const handleResumeClick = (resume: any) => {
    if (resume.pdfUrl) {
      importTemplateAndEdit(resume);
      return;
    }

    navigate(`/resume-editor?resumeId=${resume.id}`);
  };

  const [importingId, setImportingId] = useState<number | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<number | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDeleteResume, setToDeleteResume] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Close menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuOpenId !== null) setMenuOpenId(null);
    };
    window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, [menuOpenId]);

  const importTemplateAndEdit = async (resume: any) => {
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) {
        alert("You must be logged in to import this template");
        return;
      }
      const user = JSON.parse(userStr);
      setImportingId(resume.id);

      const resp = await fetch(resume.pdfUrl);
      if (!resp.ok) throw new Error("Failed to download PDF");
      const blob = await resp.blob();
      const file = new File([blob], `${resume.name || 'imported'}.pdf`, { type: 'application/pdf' });

      const uploadRes = await uploadResume(user.user_id, file, user.token);

      if (uploadRes && (uploadRes.status === 200 || uploadRes.status === 201)) {
        const imported = uploadRes.data;
        navigate(`/resume-editor?templateId=${resume.template_id || ''}`, {
          state: { importedResume: imported, resumeName: resume.name },
        });
      } else {
        alert('Failed to import resume for editing');
      }
    } catch (err) {
      console.error('Import failed', err);
      alert('Failed to import resume.');
    } finally {
      setImportingId(null);
    }
  };

  const handleDeleteResume = async (resume: any) => {
    setToDeleteResume(resume);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!toDeleteResume) return;
    setIsDeleting(true);
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) throw new Error("User not logged in");
      const user = JSON.parse(userStr);
      await deleteResumeTemplate(user.user_id, user.token, toDeleteResume.id);
      setUserResumes((prev) => prev.filter((r) => r.id !== toDeleteResume.id));
      setConfirmOpen(false);
      setToDeleteResume(null);
    } catch (err) {
      console.error("Failed to delete resume template:", err);
      alert("Failed to delete. Try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDelete = () => {
    setConfirmOpen(false);
    setToDeleteResume(null);
  };

  const handleTemplateClick = (templateId: string) => {
    // Navigate to template selection or directly to editor
    navigate(`/template-selection`);
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden font-['Baloo_2']">
      <DashNav heading="Resume Builder" />

      <div className="flex-1 bg-gray-50 overflow-auto">
        <div className="bg-white rounded-lg m-3 md:m-5 w-full max-w-[1210px] mx-auto flex flex-col" style={{ minHeight: '0' }}>

          <div className="flex flex-col mt-5 mb-10 gap-2 px-4 md:px-5">
            <span className="text-[#1A1A43] text-base font-semibold">
              Your Resume(s)
            </span>

            <div className="flex flex-wrap gap-6 bg-white">
              {/* New Resume Button */}
              <button
                className="flex flex-col items-center w-[150px] py-4 px-5 rounded-lg border-0 gap-2 cursor-pointer"
                style={{
                  background: "linear-gradient(180deg, #FFE29FDE, #FFA99F)",
                }}
                onClick={handleNewResume}
              >
                <svg className="w-[114px] h-[140px]" viewBox="0 0 140 140" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <line x1="70" y1="40" x2="70" y2="100" stroke="#3A3A3A" strokeWidth="6" strokeLinecap="round" />
                  <line x1="40" y1="70" x2="100" y2="70" stroke="#3A3A3A" strokeWidth="6" strokeLinecap="round" />
                </svg>
                <span className="text-[#3A3A3A] text-sm">New Resume</span>
              </button>

              {/* Saved Resumes */}
              {userResumes.map((resume) => (
                <div key={resume.id} className="relative ">
                  <button
                    className="flex flex-col items-center w-[150px] py-4 px-5 rounded-lg border border-gray-200 gap-2 hover:cursor-pointer hover:shadow-md transition-shadow bg-white"
                    onClick={() => {
                      setMenuOpenId(null);
                      // Simple Edit: navigate to editor with templateId and resumeTemplateId and pass resume object
                      navigate(`/resume-editor?templateId=${resume.template_id || ''}&resumeTemplateId=${resume.id}`, {
                        state: { resumeTemplate: resume },
                      });
                    }}
                  >
                    <img
                      src={resume.thumbnail}
                      alt={resume.name}
                      onError={(e) => {
                        const target = e.currentTarget as HTMLImageElement;
                        // prevent infinite loop
                        const fallback = (getTemplateById(resume.template_id || '')?.thumbnail) || '/placeholder-resume-thumb.png';
                        if (target.src === fallback) return;
                        target.onerror = null;
                        target.src = fallback;
                      }}
                      className="w-[114px] h-[140px] rounded-lg object-cover border border-gray-100"
                    />
                    <span className="text-[#3A3A3A] text-sm font-medium truncate w-full text-center">
                      {resume.name}
                    </span>
                  </button>

                  {/* three-dots menu overlay */}
                  <div className="absolute top-2 right-2 z-10">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpenId(menuOpenId === resume.id ? null : resume.id);
                      }}
                      className="bg-white p-1 rounded-full shadow-sm border border-gray-200"
                      title="Options"
                    >
                      {/* three dots vertical */}
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10 6a1.5 1.5 0 110-3 1.5 1.5 0 010 3zM10 12a1.5 1.5 0 110-3 1.5 1.5 0 010 3zM10 18a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" />
                      </svg>
                    </button>

                    {menuOpenId === resume.id && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="absolute top-full right-0 mt-1 w-36 bg-white rounded-md shadow-lg border border-gray-100 text-sm z-20"
                      >
                        <button
                          onClick={() => {
                            setMenuOpenId(null);
                            // Simple Edit: navigate to editor with templateId and resumeTemplateId and pass resume object
                            navigate(`/resume-editor?templateId=${resume.template_id || ''}&resumeTemplateId=${resume.id}`, {
                              state: { resumeTemplate: resume },
                            });
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-gray-50"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            setMenuOpenId(null);
                            handleDeleteResume(resume);
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-gray-50 text-red-600"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {userResumes.length === 0 && (
                <div className="w-full flex flex-col items-center justify-center py-12 text-center">
                  <span className="text-[#3A3A3A] text-lg">
                    You don't have any resume(s) created. Create one now by selecting a template!!
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* <div className="mb-5 px-4 md:px-5">
            <span className="text-[#1A1A43] text-base font-semibold">Our Recommended Templates</span>
          </div> */}

          {/* Templates: responsive grid (scrollable) - shows all templates */}
          {/* <div className="mb-10 px-4 md:px-5 flex-1 overflow-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10 p-4" style={{ paddingBottom: 12 }}>
              {templates.map((template) => (
                <button
                  key={template.id}
                  className="relative w-full rounded-lg shadow-sm border-0 hover:shadow-lg transition-shadow overflow-hidden"
                  style={{ boxShadow: "0px 0px 1px #00000040" }}
                  onClick={() => handleTemplateClick(template.id)}
                >
                  <img
                    src={template.thumbnail}
                    alt={template.name}
                    className="w-full h-[260px] md:h-[320px] lg:h-[439px] object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                    <span className="text-white text-sm font-medium">{template.name}</span>
                  </div>
                </button>
              ))}
            </div>
          </div> */}

        </div>
      </div>
      {/* Confirm Delete Modal */}
      {confirmOpen && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40" onClick={cancelDelete} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Delete Resume</h3>
              <p className="text-sm text-gray-600 mb-6">
                Are you sure you want to delete
                <span className="font-medium"> {toDeleteResume?.name}</span>?
                This action cannot be undone.
              </p>

              <div className="flex justify-end gap-3">
                <button
                  onClick={cancelDelete}
                  className="px-4 py-2 rounded-full border border-gray-300 text-sm hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 rounded-full bg-red-600 text-white text-sm hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    "Delete"
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}