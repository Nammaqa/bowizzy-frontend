
import { useState } from "react";
import { Plus, Trash2, Calendar } from "lucide-react";

interface Education {
  standard: string;
  instituteName: string;
  markType: string;
  yearOfPassing: string;
  grade: string;
  board: string;
  isExpanded: boolean;
}

interface EducationDetailsProps {
  formData: any;
  setFormData: (data: any) => void;
  onNext: () => void;
  onPrevious: () => void;
}

const EducationDetails = ({
  formData,
  setFormData,
  onNext,
  onPrevious,
}: EducationDetailsProps) => {
  const [educations, setEducations] = useState<Education[]>(
    formData.educations || [
      {
        standard: "",
        instituteName: "",
        markType: "",
        yearOfPassing: "",
        grade: "",
        board: "",
        isExpanded: true,
      },
    ]
  );

  const addEducation = () => {
    setEducations([
      ...educations,
      {
        standard: "",
        instituteName: "",
        markType: "",
        yearOfPassing: "",
        grade: "",
        board: "",
        isExpanded: true,
      },
    ]);
  };

  const removeEducation = (index: number) => {
    setEducations(educations.filter((_, i) => i !== index));
  };

  const updateEducation = (index: number, field: string, value: any) => {
    const updated = [...educations];
    updated[index] = { ...updated[index], [field]: value };
    setEducations(updated);
  };

  const toggleExpand = (index: number) => {
    const updated = [...educations];
    updated[index].isExpanded = !updated[index].isExpanded;
    setEducations(updated);
  };

  const handleNext = () => {
    setFormData({ ...formData, educations });
    onNext();
  };

  const getEducationTitle = (index: number) => {
    const titles = [
      "SSC/10th Standard",
      "PUC/Diploma / (10th+2)",
      "Higher Education",
    ];
    return titles[index] || "Degree";
  };

  return (
    <div className="bg-white rounded-md p-6">
      <div className="space-y-6">
        {educations.map((edu, index) => (
          <div key={index} className="border border-gray-200 rounded-md p-5">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-semibold text-[#3A3A3A]">
                {getEducationTitle(index)}
              </h4>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleExpand(index)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  {edu.isExpanded ? (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 15l7-7 7 7"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  )}
                </button>
                {index > 0 && (
                  <button
                    onClick={() => removeEducation(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            </div>

            {edu.isExpanded && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Institution Name
                  </label>
                  <input
                    type="text"
                    value={edu.instituteName}
                    onChange={(e) =>
                      updateEducation(index, "instituteName", e.target.value)
                    }
                    placeholder="Enter Institution Name"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF8351]"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Mark Type
                  </label>
                  <select
                    value={edu.markType}
                    onChange={(e) =>
                      updateEducation(index, "markType", e.target.value)
                    }
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF8351]"
                  >
                    <option value="">Select Board/ Format</option>
                    <option value="percentage">Percentage</option>
                    <option value="cgpa">CGPA</option>
                    <option value="grade">Grade</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Grade/ Grade
                  </label>
                  <input
                    type="text"
                    value={edu.grade}
                    onChange={(e) =>
                      updateEducation(index, "grade", e.target.value)
                    }
                    placeholder="Enter Board/ Format"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF8351]"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Board
                  </label>
                  <select
                    value={edu.board}
                    onChange={(e) =>
                      updateEducation(index, "board", e.target.value)
                    }
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF8351]"
                  >
                    <option value="">State Board</option>
                    <option value="cbse">CBSE</option>
                    <option value="icse">ICSE</option>
                    <option value="state">State Board</option>
                  </select>
                </div>

                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Start Date
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Select Year of Passing"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF8351]"
                      />
                      <Calendar
                        size={16}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      End Date
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Select Year of Passing"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF8351]"
                      />
                      <Calendar
                        size={16}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                      />
                      <label className="flex items-center gap-2 mt-2 text-xs text-gray-600">
                        <input type="checkbox" className="rounded" />
                        Currently Pursuing
                      </label>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs text-gray-600 mb-1">
                    Diploma Format
                  </label>
                  <select className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF8351]">
                    <option value="">Select Board/ Format</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        ))}

        <button
          onClick={addEducation}
          className="flex items-center gap-2 text-[#FF8351] font-medium text-sm hover:text-[#FF9D48] transition-colors"
        >
          <Plus size={18} />
          Add Education
        </button>

        {/* Navigation Buttons */}
        <div className="flex justify-end mt-6 space-x-4">
          <button
            onClick={onPrevious}
            className="px-6 py-2.5 rounded-md border-2 border-[#FF8351] text-[#FF8351] font-semibold hover:bg-[#FFF5F0] transition-colors"
          >
            Previous
          </button>
          <button
            onClick={handleNext}
            className="px-6 py-2.5 rounded-md text-white font-semibold transition-transform hover:scale-105"
            style={{
              background: "linear-gradient(180deg, #FF9D48 0%, #FF8251 100%)",
            }}
          >
            Proceed to next
          </button>
        </div>
      </div>
    </div>
  );
};

export default EducationDetails;