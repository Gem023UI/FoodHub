import { useState, useEffect } from "react";
import { Footer } from "../components/Footer";
import Loader from "../components/Loader";
import { getStalls, createStall, updateStall, deleteStall } from "../services/stall.service";
import {
  getStallSectionStatus,
  getStallDetailsWithRevenue
} from "../services/report.service";
import "../styles/AdminStalls.css";

// Chart.js imports
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Filler
} from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Filler
);

interface Stall {
  _id: string;
  stallName: string;
  stallDescription: string;
  stallPicture: string | null;
  section: number;
  status: boolean;
  openHours?: {
    openTime: string;
    closingTime: string;
  };
  proofOfContract?: string | null;
  vendors?: any[];
  products?: any[];
}

interface VendorInput {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  vendorImage: string | null;
  position: string;
  role: string;
  status: string;
  password: string;
}

interface AdminStallsProps {
  token: string;
  onNavigate: (page: string) => void;
  onLogout?: () => void;
}

const SECTIONS = Array.from({ length: 12 }, (_, i) => i + 1);
const VENDOR_POSITIONS = ["Cook", "Manager", "Financier"];
const VENDOR_STATUSES = ["verified", "unverified", "deactivated"];

// ── API Base URL ────────────────────────────────────────────────────────
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "/api";

// Color palette
const COLORS = {
  red: '#ff3131',
  orange: '#ff751f',
  yellow: '#ffde59',
  green: '#4ecdc4',
  blue: '#4a90d9',
  purple: '#9b59b6',
};

const CHART_COLORS = [
  '#ff3131', '#ff751f', '#ffde59', '#4ecdc4', '#4a90d9',
  '#9b59b6', '#e91e63', '#1abc9c', '#f39c12', '#2ecc71',
  '#3498db', '#e74c3c'
];

export function AdminStalls({ token, onNavigate, onLogout }: AdminStallsProps) {
  const [stalls, setStalls] = useState<Stall[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Chart data states
  const [sectionStatusData, setSectionStatusData] = useState<any>(null);
  const [stallRevenueData, setStallRevenueData] = useState<any>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedStall, setSelectedStall] = useState<Stall | null>(null);

  // Form states
  const [formData, setFormData] = useState<Partial<Stall>>({
    stallName: "",
    stallDescription: "",
    stallPicture: null,
    section: 1,
    status: true,
    openHours: {
      openTime: "",
      closingTime: ""
    },
    proofOfContract: null,
    vendors: []
  });

  // Vendor form states
  const [vendorForm, setVendorForm] = useState<VendorInput>({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    vendorImage: null,
    position: "Cook",
    role: "vendor",
    status: "verified",
    password: ""
  });
  const [showVendorForm, setShowVendorForm] = useState(false);
  const [editingVendorIndex, setEditingVendorIndex] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingContract, setUploadingContract] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Image preview states
  const [stallImagePreview, setStallImagePreview] = useState<string | null>(null);
  const [contractPreview, setContractPreview] = useState<string | null>(null);
  const [vendorImagePreview, setVendorImagePreview] = useState<string | null>(null);

  useEffect(() => {
    fetchStalls();
    fetchChartData();
  }, [token]);

  async function fetchStalls() {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getStalls();
      setStalls(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load stalls");
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchChartData() {
    try {
      const sectionStatus = await getStallSectionStatus(token);
      setSectionStatusData({
        labels: ['Occupied Sections', 'Empty Sections'],
        datasets: [
          {
            data: [sectionStatus.occupiedSections, sectionStatus.emptySections],
            backgroundColor: [COLORS.green, COLORS.red],
            borderWidth: 2,
            borderColor: '#fff',
          }
        ]
      });

      const stalls = await getStallDetailsWithRevenue(token);
      const sortedStalls = stalls.sort((a, b) => b.totalRevenue - a.totalRevenue).slice(0, 10);
      setStallRevenueData({
        labels: sortedStalls.map(s => s.stallName.length > 15 ? s.stallName.slice(0, 15) + '...' : s.stallName),
        datasets: [
          {
            label: 'Revenue (₱)',
            data: sortedStalls.map(s => s.totalRevenue),
            backgroundColor: CHART_COLORS.slice(0, sortedStalls.length),
            borderWidth: 1,
            borderRadius: 4,
          }
        ]
      });
    } catch (err) {
      console.error("Error fetching chart data:", err);
    }
  }

  // ─── IMAGE UPLOAD FUNCTIONS ────────────────────────────────────────────
  async function uploadImage(file: File, folder: string): Promise<string> {
    const formData = new FormData();
    formData.append("image", file);
    formData.append("folder", folder);

    const response = await fetch(`${apiBaseUrl}/uploads/stall-image`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to upload image");
    }

    const data = await response.json();
    return data.url;
  }

  // ─── STALL IMAGE HANDLERS ──────────────────────────────────────────────
  function handleStallImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size should be less than 5MB.");
      return;
    }
    setFormData(prev => ({ ...prev, stallPictureFile: file }));
    setStallImagePreview(URL.createObjectURL(file));
  }

  function handleContractSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("Contract file should be less than 5MB.");
      return;
    }
    setFormData(prev => ({ ...prev, proofOfContractFile: file }));
    setContractPreview(URL.createObjectURL(file));
  }

  function handleVendorImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError("Vendor image should be less than 2MB.");
      return;
    }
    setVendorForm(prev => ({ ...prev, vendorImageFile: file }));
    setVendorImagePreview(URL.createObjectURL(file));
  }

  // ─── VENDOR CRUD OPERATIONS ────────────────────────────────────────────
  function addVendor() {
    if (!vendorForm.firstName || !vendorForm.lastName || !vendorForm.email || !vendorForm.phoneNumber) {
      setError("Please fill in all vendor fields.");
      return;
    }

    if (!vendorForm.password || vendorForm.password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    const existingVendors = formData.vendors as VendorInput[] || [];
    if (existingVendors.some(v => v.email === vendorForm.email)) {
      setError("A vendor with this email already exists.");
      return;
    }

    const newVendor = {
      firstName: vendorForm.firstName,
      lastName: vendorForm.lastName,
      email: vendorForm.email,
      phoneNumber: vendorForm.phoneNumber,
      vendorImage: vendorForm.vendorImage || null,
      position: vendorForm.position,
      role: "vendor",
      status: vendorForm.status,
      password: vendorForm.password
    };

    if (editingVendorIndex !== null) {
      const updatedVendors = [...existingVendors];
      updatedVendors[editingVendorIndex] = newVendor;
      setFormData(prev => ({ ...prev, vendors: updatedVendors }));
      setEditingVendorIndex(null);
    } else {
      setFormData(prev => ({ 
        ...prev, 
        vendors: [...existingVendors, newVendor] 
      }));
    }

    resetVendorForm();
    setShowVendorForm(false);
    setSuccessMsg(editingVendorIndex !== null ? "Vendor updated!" : "Vendor added!");
    setTimeout(() => setSuccessMsg(null), 3000);
  }

  function editVendor(index: number) {
    const vendors = formData.vendors as VendorInput[] || [];
    const vendor = vendors[index];
    setVendorForm({
      firstName: vendor.firstName,
      lastName: vendor.lastName,
      email: vendor.email,
      phoneNumber: vendor.phoneNumber || "",
      vendorImage: vendor.vendorImage || null,
      position: vendor.position || "Cook",
      role: "vendor",
      status: vendor.status || "verified",
      password: vendor.password || ""
    });
    setVendorImagePreview(vendor.vendorImage || null);
    setEditingVendorIndex(index);
    setShowVendorForm(true);
  }

  function removeVendor(index: number) {
    const vendors = formData.vendors as VendorInput[] || [];
    const updatedVendors = vendors.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, vendors: updatedVendors }));
    if (editingVendorIndex === index) {
      resetVendorForm();
      setEditingVendorIndex(null);
      setShowVendorForm(false);
    }
  }

  function resetVendorForm() {
    setVendorForm({
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      vendorImage: null,
      position: "Cook",
      role: "vendor",
      status: "verified",
      password: ""
    });
    setVendorImagePreview(null);
    setEditingVendorIndex(null);
  }

  // ─── FORM SUBMISSION ────────────────────────────────────────────────────
  async function handleAddStall(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      let stallPictureUrl = null;
      let proofOfContractUrl = null;
      const vendors = formData.vendors as VendorInput[] || [];

      if (formData.stallPictureFile) {
        setUploadingImage(true);
        stallPictureUrl = await uploadImage(formData.stallPictureFile as File, "stalls");
        setUploadingImage(false);
      }

      if (formData.proofOfContractFile) {
        setUploadingContract(true);
        proofOfContractUrl = await uploadImage(formData.proofOfContractFile as File, "contracts");
        setUploadingContract(false);
      }

      const vendorsWithImages = await Promise.all(vendors.map(async (vendor) => {
        let vendorImageUrl = vendor.vendorImage || null;
        if (vendor.vendorImageFile) {
          vendorImageUrl = await uploadImage(vendor.vendorImageFile as File, "vendors");
        }
        return {
          ...vendor,
          vendorImage: vendorImageUrl
        };
      }));

      const stallData = {
        stallName: formData.stallName,
        stallDescription: formData.stallDescription || "",
        stallPicture: stallPictureUrl,
        section: formData.section,
        status: true,
        openHours: formData.openHours || { openTime: "", closingTime: "" },
        proofOfContract: proofOfContractUrl,
        vendors: vendorsWithImages
      };

      const result = await createStall(token, stallData);
      setStalls(prev => [...prev, result.stall]);
      setShowAddModal(false);
      resetForm();
      setSuccessMsg("Stall added successfully!");
      setTimeout(() => setSuccessMsg(null), 3000);
      fetchChartData();
    } catch (err) {
      console.error("Error adding stall:", err);
      setError(err instanceof Error ? err.message : "Failed to add stall");
    } finally {
      setIsSubmitting(false);
      setUploadingImage(false);
      setUploadingContract(false);
    }
  }

  async function handleUpdateStall(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (!selectedStall) return;
      
      let stallPictureUrl = formData.stallPicture;
      let proofOfContractUrl = formData.proofOfContract;
      const vendors = formData.vendors as VendorInput[] || [];

      if (formData.stallPictureFile) {
        setUploadingImage(true);
        stallPictureUrl = await uploadImage(formData.stallPictureFile as File, "stalls");
        setUploadingImage(false);
      }

      if (formData.proofOfContractFile) {
        setUploadingContract(true);
        proofOfContractUrl = await uploadImage(formData.proofOfContractFile as File, "contracts");
        setUploadingContract(false);
      }

      const vendorsWithImages = await Promise.all(vendors.map(async (vendor) => {
        let vendorImageUrl = vendor.vendorImage || null;
        if (vendor.vendorImageFile) {
          vendorImageUrl = await uploadImage(vendor.vendorImageFile as File, "vendors");
        }
        return {
          ...vendor,
          vendorImage: vendorImageUrl
        };
      }));

      const updateData = {
        stallName: formData.stallName,
        stallDescription: formData.stallDescription || "",
        stallPicture: stallPictureUrl,
        section: formData.section,
        status: formData.status,
        openHours: formData.openHours || { openTime: "", closingTime: "" },
        proofOfContract: proofOfContractUrl,
        vendors: vendorsWithImages
      };

      const result = await updateStall(token, selectedStall._id, updateData);
      setStalls(prev => prev.map(s => s._id === selectedStall._id ? result.stall : s));
      setShowEditModal(false);
      resetForm();
      setSuccessMsg("Stall updated successfully!");
      setTimeout(() => setSuccessMsg(null), 3000);
      fetchChartData();
    } catch (err) {
      console.error("Error updating stall:", err);
      setError(err instanceof Error ? err.message : "Failed to update stall");
    } finally {
      setIsSubmitting(false);
      setUploadingImage(false);
      setUploadingContract(false);
    }
  }

  async function handleDeleteStall() {
    setIsSubmitting(true);
    setError(null);
    try {
      if (!selectedStall) return;
      await deleteStall(token, selectedStall._id);
      setStalls(prev => prev.filter(s => s._id !== selectedStall._id));
      setShowDeleteModal(false);
      setSelectedStall(null);
      setSuccessMsg("Stall deleted successfully!");
      setTimeout(() => setSuccessMsg(null), 3000);
      fetchChartData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete stall");
    } finally {
      setIsSubmitting(false);
    }
  }

  function resetForm() {
    setFormData({
      stallName: "",
      stallDescription: "",
      stallPicture: null,
      section: 1,
      status: true,
      openHours: {
        openTime: "",
        closingTime: ""
      },
      proofOfContract: null,
      vendors: []
    });
    setStallImagePreview(null);
    setContractPreview(null);
    setVendorImagePreview(null);
    resetVendorForm();
    setShowVendorForm(false);
    setEditingVendorIndex(null);
    setSelectedStall(null);
  }

  function openEditModal(stall: Stall) {
    setSelectedStall(stall);
    setFormData({
      stallName: stall.stallName,
      stallDescription: stall.stallDescription || "",
      stallPicture: stall.stallPicture,
      section: stall.section,
      status: stall.status,
      openHours: stall.openHours || { openTime: "", closingTime: "" },
      proofOfContract: stall.proofOfContract || null,
      vendors: stall.vendors || []
    });
    setStallImagePreview(stall.stallPicture || null);
    setContractPreview(stall.proofOfContract || null);
    setShowEditModal(true);
  }

  function openDeleteModal(stall: Stall) {
    setSelectedStall(stall);
    setShowDeleteModal(true);
  }

  function openAddModal() {
    resetForm();
    setShowAddModal(true);
  }

  // Chart options
  const pieOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          font: { size: 12, family: 'Poppins' },
          padding: 16,
          usePointStyle: true,
          pointStyle: 'circle',
        }
      }
    },
    cutout: '60%',
  };

  const barOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0,0,0,0.05)',
        },
        ticks: {
          font: { size: 11 },
          callback: function(value: any) {
            return '₱' + value.toLocaleString();
          }
        }
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: { size: 10 },
        }
      }
    },
  };

  if (isLoading) {
    return (
      <div className="admin-stalls-page">
        <div className="admin-loading">
          <Loader />
        </div>
        <Footer onNavigate={onNavigate} />
      </div>
    );
  }

  return (
    <div className="admin-stalls-page">
      <div className="admin-stalls-container">
        <div className="admin-stalls-header">
          <div className="header-left">
            <h1>Manage Stalls</h1>
            <p className="subtitle">{stalls.length} stalls total</p>
          </div>
          <button className="add-btn" onClick={openAddModal}>
            <i className="fas fa-plus"></i> Add Stall
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {successMsg && <div className="alert alert-success">{successMsg}</div>}

        {/* ─── CHARTS SECTION ─────────────────────────────────────────────── */}
        <div className="stalls-charts-section">
          <div className="section-header">
            <h2>📊 Stall Analytics</h2>
          </div>
          <div className="charts-grid-2">
            {/* Pie: Section Status */}
            <div className="chart-container">
              <h3>Sections Overview</h3>
              {sectionStatusData ? (
                <Pie data={sectionStatusData} options={pieOptions} />
              ) : (
                <div className="chart-placeholder">Loading...</div>
              )}
              <p className="chart-total">
                Total Sections: 12 | Occupied: {sectionStatusData?.datasets[0]?.data[0] || 0} | Empty: {sectionStatusData?.datasets[0]?.data[1] || 0}
              </p>
            </div>

            {/* Bar: Stall Revenue */}
            <div className="chart-container">
              <h3>Top Stalls by Revenue</h3>
              {stallRevenueData ? (
                <Bar data={stallRevenueData} options={barOptions} />
              ) : (
                <div className="chart-placeholder">Loading...</div>
              )}
            </div>
          </div>
        </div>

        {/* ─── TABLE SECTION ───────────────────────────────────────────────── */}
        <div className="table-section">
          <h2>📋 Stall Records</h2>
          {stalls.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🏪</div>
              <h3>No Stalls Yet</h3>
              <p>Start by adding your first stall.</p>
              <button className="btn-primary" onClick={openAddModal}>
                Add Stall
              </button>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Section</th>
                    <th>Status</th>
                    <th>Vendors</th>
                    <th>Products</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {stalls.map((stall) => (
                    <tr key={stall._id}>
                      <td className="stall-name">{stall.stallName}</td>
                      <td>Section {stall.section}</td>
                      <td>
                        <span className={`status-badge ${stall.status ? "active" : "inactive"}`}>
                          {stall.status ? "Open" : "Closed"}
                        </span>
                      </td>
                      <td>{stall.vendors?.length || 0}</td>
                      <td>{stall.products?.length || 0}</td>
                      <td>
                        <div className="action-buttons">
                          <button className="action-btn edit" onClick={() => openEditModal(stall)}>
                            <i className="fas fa-edit"></i>
                          </button>
                          <button className="action-btn delete" onClick={() => openDeleteModal(stall)}>
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ─── ADD STALL MODAL ────────────────────────────────────────────── */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New Stall</h2>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            <form onSubmit={handleAddStall} className="admin-form">
              {/* Stall Basic Info */}
              <div className="form-section-title">Stall Information</div>
              <div className="form-row">
                <div className="form-group">
                  <label>Stall Name *</label>
                  <input
                    type="text"
                    value={formData.stallName || ""}
                    onChange={(e) => setFormData({ ...formData, stallName: e.target.value })}
                    required
                    placeholder="e.g., Tapsihan ni Juan"
                  />
                </div>
                <div className="form-group">
                  <label>Section *</label>
                  <select
                    value={formData.section || 1}
                    onChange={(e) => setFormData({ ...formData, section: Number(e.target.value) })}
                    required
                  >
                    {SECTIONS.map(s => (
                      <option key={s} value={s}>Section {s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.stallDescription || ""}
                  onChange={(e) => setFormData({ ...formData, stallDescription: e.target.value })}
                  rows={2}
                  placeholder="Describe your stall..."
                />
              </div>

              {/* Stall Image */}
              <div className="form-group">
                <label>Stall Picture</label>
                <div className="image-upload-container">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleStallImageSelect}
                    className="image-upload-input"
                    id="stall-image-upload"
                  />
                  <label htmlFor="stall-image-upload" className="image-upload-label">
                    <i className="fas fa-cloud-upload-alt"></i>
                    <span>Choose Image</span>
                  </label>
                  {stallImagePreview && (
                    <div className="image-preview">
                      <img src={stallImagePreview} alt="Stall Preview" />
                      <button
                        type="button"
                        className="image-remove"
                        onClick={() => {
                          setStallImagePreview(null);
                          setFormData(prev => ({ ...prev, stallPictureFile: null }));
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
                <p className="field-hint">Supported formats: JPG, PNG, WebP. Max size: 5MB</p>
              </div>

              {/* Operating Hours */}
              <div className="form-section-title">Operating Hours</div>
              <div className="form-row">
                <div className="form-group">
                  <label>Open Time</label>
                  <input
                    type="time"
                    value={formData.openHours?.openTime || ""}
                    onChange={(e) => setFormData({
                      ...formData,
                      openHours: { ...formData.openHours, openTime: e.target.value }
                    })}
                  />
                </div>
                <div className="form-group">
                  <label>Closing Time</label>
                  <input
                    type="time"
                    value={formData.openHours?.closingTime || ""}
                    onChange={(e) => setFormData({
                      ...formData,
                      openHours: { ...formData.openHours, closingTime: e.target.value }
                    })}
                  />
                </div>
              </div>

              {/* Proof of Contract */}
              <div className="form-group">
                <label>Proof of Contract</label>
                <div className="image-upload-container">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleContractSelect}
                    className="image-upload-input"
                    id="contract-upload"
                  />
                  <label htmlFor="contract-upload" className="image-upload-label">
                    <i className="fas fa-file-contract"></i>
                    <span>Upload Contract</span>
                  </label>
                  {contractPreview && (
                    <div className="image-preview">
                      <img src={contractPreview} alt="Contract Preview" />
                      <button
                        type="button"
                        className="image-remove"
                        onClick={() => {
                          setContractPreview(null);
                          setFormData(prev => ({ ...prev, proofOfContractFile: null }));
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
                <p className="field-hint">Supported formats: JPG, PNG, PDF. Max size: 5MB</p>
              </div>

              {/* Vendors Section */}
              <div className="form-section-title">
                Vendors
                <button
                  type="button"
                  className="add-vendor-btn"
                  onClick={() => {
                    resetVendorForm();
                    setShowVendorForm(true);
                    setEditingVendorIndex(null);
                  }}
                >
                  <i className="fas fa-plus"></i> Add Vendor
                </button>
              </div>

              {/* Vendor List */}
              {(formData.vendors as VendorInput[] || []).length > 0 && (
                <div className="vendor-list">
                  {(formData.vendors as VendorInput[] || []).map((vendor, index) => (
                    <div key={index} className="vendor-item">
                      <div className="vendor-item-info">
                        <span className="vendor-name">{vendor.firstName} {vendor.lastName}</span>
                        <span className="vendor-email">{vendor.email}</span>
                        <span className="vendor-position">{vendor.position}</span>
                        <span className={`vendor-status-badge ${vendor.status === 'verified' ? 'active' : vendor.status === 'deactivated' ? 'deactivated' : 'pending'}`}>
                          {vendor.status || 'pending'}
                        </span>
                      </div>
                      <div className="vendor-item-actions">
                        <button
                          type="button"
                          className="action-btn edit"
                          onClick={() => editVendor(index)}
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button
                          type="button"
                          className="action-btn delete"
                          onClick={() => removeVendor(index)}
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Vendor Form */}
              {showVendorForm && (
                <div className="vendor-form-container">
                  <div className="vendor-form-header">
                    <h4>{editingVendorIndex !== null ? "Edit Vendor" : "Add Vendor"}</h4>
                    <button
                      type="button"
                      className="vendor-form-close"
                      onClick={() => {
                        setShowVendorForm(false);
                        resetVendorForm();
                      }}
                    >
                      ✕
                    </button>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>First Name *</label>
                      <input
                        type="text"
                        value={vendorForm.firstName}
                        onChange={(e) => setVendorForm({ ...vendorForm, firstName: e.target.value })}
                        placeholder="Juan"
                      />
                    </div>
                    <div className="form-group">
                      <label>Last Name *</label>
                      <input
                        type="text"
                        value={vendorForm.lastName}
                        onChange={(e) => setVendorForm({ ...vendorForm, lastName: e.target.value })}
                        placeholder="dela Cruz"
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Email *</label>
                      <input
                        type="email"
                        value={vendorForm.email}
                        onChange={(e) => setVendorForm({ ...vendorForm, email: e.target.value })}
                        placeholder="vendor@example.com"
                      />
                    </div>
                    <div className="form-group">
                      <label>Phone Number *</label>
                      <input
                        type="tel"
                        value={vendorForm.phoneNumber}
                        onChange={(e) => setVendorForm({ ...vendorForm, phoneNumber: e.target.value })}
                        placeholder="09123456789"
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Position *</label>
                      <select
                        value={vendorForm.position}
                        onChange={(e) => setVendorForm({ ...vendorForm, position: e.target.value })}
                      >
                        {VENDOR_POSITIONS.map(pos => (
                          <option key={pos} value={pos}>{pos}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Status</label>
                      <select
                        value={vendorForm.status}
                        onChange={(e) => setVendorForm({ ...vendorForm, status: e.target.value })}
                      >
                        {VENDOR_STATUSES.map(status => (
                          <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Vendor Image</label>
                      <div className="image-upload-container small">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleVendorImageSelect}
                          className="image-upload-input"
                          id="vendor-image-upload"
                        />
                        <label htmlFor="vendor-image-upload" className="image-upload-label small">
                          <i className="fas fa-user"></i>
                          <span>Upload</span>
                        </label>
                        {vendorImagePreview && (
                          <div className="image-preview small">
                            <img src={vendorImagePreview} alt="Vendor Preview" />
                            <button
                              type="button"
                              className="image-remove"
                              onClick={() => {
                                setVendorImagePreview(null);
                                setVendorForm(prev => ({ ...prev, vendorImageFile: null }));
                              }}
                            >
                              ✕
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Password *</label>
                      <div className="password-input-wrapper">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={vendorForm.password}
                          onChange={(e) => setVendorForm({ ...vendorForm, password: e.target.value })}
                          placeholder="Minimum 8 characters"
                          className="password-input"
                        />
                        <button
                          type="button"
                          className="password-toggle-btn"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          <i className={`fas ${showPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
                        </button>
                      </div>
                      <p className="field-hint">Password must be at least 8 characters long.</p>
                    </div>
                  </div>
                  <div className="vendor-form-actions">
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => {
                        setShowVendorForm(false);
                        resetVendorForm();
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={addVendor}
                    >
                      {editingVendorIndex !== null ? "Update Vendor" : "Add Vendor"}
                    </button>
                  </div>
                </div>
              )}

              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? (uploadingImage || uploadingContract ? "Uploading..." : "Adding...") : "Add Stall"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── EDIT STALL MODAL ───────────────────────────────────────────── */}
      {showEditModal && selectedStall && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Stall</h2>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>✕</button>
            </div>
            <form onSubmit={handleUpdateStall} className="admin-form">
              {/* Stall Basic Info */}
              <div className="form-section-title">Stall Information</div>
              <div className="form-row">
                <div className="form-group">
                  <label>Stall Name *</label>
                  <input
                    type="text"
                    value={formData.stallName || ""}
                    onChange={(e) => setFormData({ ...formData, stallName: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Section *</label>
                  <select
                    value={formData.section || 1}
                    onChange={(e) => setFormData({ ...formData, section: Number(e.target.value) })}
                    required
                  >
                    {SECTIONS.map(s => (
                      <option key={s} value={s}>Section {s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.stallDescription || ""}
                  onChange={(e) => setFormData({ ...formData, stallDescription: e.target.value })}
                  rows={2}
                />
              </div>

              {/* Stall Image */}
              <div className="form-group">
                <label>Stall Picture</label>
                <div className="image-upload-container">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleStallImageSelect}
                    className="image-upload-input"
                    id="edit-stall-image-upload"
                  />
                  <label htmlFor="edit-stall-image-upload" className="image-upload-label">
                    <i className="fas fa-cloud-upload-alt"></i>
                    <span>Change Image</span>
                  </label>
                  {stallImagePreview && (
                    <div className="image-preview">
                      <img src={stallImagePreview} alt="Stall Preview" />
                      <button
                        type="button"
                        className="image-remove"
                        onClick={() => {
                          setStallImagePreview(null);
                          setFormData(prev => ({ ...prev, stallPictureFile: null, stallPicture: null }));
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
                <p className="field-hint">Current image will be replaced when you upload a new one.</p>
              </div>

              {/* Operating Hours */}
              <div className="form-section-title">Operating Hours</div>
              <div className="form-row">
                <div className="form-group">
                  <label>Open Time</label>
                  <input
                    type="time"
                    value={formData.openHours?.openTime || ""}
                    onChange={(e) => setFormData({
                      ...formData,
                      openHours: { ...formData.openHours, openTime: e.target.value }
                    })}
                  />
                </div>
                <div className="form-group">
                  <label>Closing Time</label>
                  <input
                    type="time"
                    value={formData.openHours?.closingTime || ""}
                    onChange={(e) => setFormData({
                      ...formData,
                      openHours: { ...formData.openHours, closingTime: e.target.value }
                    })}
                  />
                </div>
              </div>

              {/* Status */}
              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.status !== false}
                    onChange={(e) => setFormData({ ...formData, status: e.target.checked })}
                  />
                  Open
                </label>
              </div>

              {/* Proof of Contract */}
              <div className="form-group">
                <label>Proof of Contract</label>
                <div className="image-upload-container">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleContractSelect}
                    className="image-upload-input"
                    id="edit-contract-upload"
                  />
                  <label htmlFor="edit-contract-upload" className="image-upload-label">
                    <i className="fas fa-file-contract"></i>
                    <span>Change Contract</span>
                  </label>
                  {contractPreview && (
                    <div className="image-preview">
                      <img src={contractPreview} alt="Contract Preview" />
                      <button
                        type="button"
                        className="image-remove"
                        onClick={() => {
                          setContractPreview(null);
                          setFormData(prev => ({ ...prev, proofOfContractFile: null, proofOfContract: null }));
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
                <p className="field-hint">Current contract will be replaced when you upload a new one.</p>
              </div>

              {/* Vendors Section */}
              <div className="form-section-title">
                Vendors
                <button
                  type="button"
                  className="add-vendor-btn"
                  onClick={() => {
                    resetVendorForm();
                    setShowVendorForm(true);
                    setEditingVendorIndex(null);
                  }}
                >
                  <i className="fas fa-plus"></i> Add Vendor
                </button>
              </div>

              {/* Vendor List */}
              {(formData.vendors as VendorInput[] || []).length > 0 && (
                <div className="vendor-list">
                  {(formData.vendors as VendorInput[] || []).map((vendor, index) => (
                    <div key={index} className="vendor-item">
                      <div className="vendor-item-info">
                        <span className="vendor-name">{vendor.firstName} {vendor.lastName}</span>
                        <span className="vendor-email">{vendor.email}</span>
                        <span className="vendor-position">{vendor.position}</span>
                        <span className={`vendor-status-badge ${vendor.status === 'verified' ? 'active' : vendor.status === 'deactivated' ? 'deactivated' : 'pending'}`}>
                          {vendor.status || 'pending'}
                        </span>
                      </div>
                      <div className="vendor-item-actions">
                        <button
                          type="button"
                          className="action-btn edit"
                          onClick={() => editVendor(index)}
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button
                          type="button"
                          className="action-btn delete"
                          onClick={() => removeVendor(index)}
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Vendor Form */}
              {showVendorForm && (
                <div className="vendor-form-container">
                  <div className="vendor-form-header">
                    <h4>{editingVendorIndex !== null ? "Edit Vendor" : "Add Vendor"}</h4>
                    <button
                      type="button"
                      className="vendor-form-close"
                      onClick={() => {
                        setShowVendorForm(false);
                        resetVendorForm();
                      }}
                    >
                      ✕
                    </button>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>First Name *</label>
                      <input
                        type="text"
                        value={vendorForm.firstName}
                        onChange={(e) => setVendorForm({ ...vendorForm, firstName: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Last Name *</label>
                      <input
                        type="text"
                        value={vendorForm.lastName}
                        onChange={(e) => setVendorForm({ ...vendorForm, lastName: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Email *</label>
                      <input
                        type="email"
                        value={vendorForm.email}
                        onChange={(e) => setVendorForm({ ...vendorForm, email: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Phone Number *</label>
                      <input
                        type="tel"
                        value={vendorForm.phoneNumber}
                        onChange={(e) => setVendorForm({ ...vendorForm, phoneNumber: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Position *</label>
                      <select
                        value={vendorForm.position}
                        onChange={(e) => setVendorForm({ ...vendorForm, position: e.target.value })}
                      >
                        {VENDOR_POSITIONS.map(pos => (
                          <option key={pos} value={pos}>{pos}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Status</label>
                      <select
                        value={vendorForm.status}
                        onChange={(e) => setVendorForm({ ...vendorForm, status: e.target.value })}
                      >
                        {VENDOR_STATUSES.map(status => (
                          <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Vendor Image</label>
                      <div className="image-upload-container small">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleVendorImageSelect}
                          className="image-upload-input"
                          id="edit-vendor-image-upload"
                        />
                        <label htmlFor="edit-vendor-image-upload" className="image-upload-label small">
                          <i className="fas fa-user"></i>
                          <span>Upload</span>
                        </label>
                        {vendorImagePreview && (
                          <div className="image-preview small">
                            <img src={vendorImagePreview} alt="Vendor Preview" />
                            <button
                              type="button"
                              className="image-remove"
                              onClick={() => {
                                setVendorImagePreview(null);
                                setVendorForm(prev => ({ ...prev, vendorImageFile: null }));
                              }}
                            >
                              ✕
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Password</label>
                      <div className="password-input-wrapper">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={vendorForm.password}
                          onChange={(e) => setVendorForm({ ...vendorForm, password: e.target.value })}
                          placeholder="Leave blank to keep current password"
                          className="password-input"
                        />
                        <button
                          type="button"
                          className="password-toggle-btn"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          <i className={`fas ${showPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
                        </button>
                      </div>
                      <p className="field-hint">Leave blank to keep current password. Minimum 8 characters if changing.</p>
                    </div>
                  </div>
                  <div className="vendor-form-actions">
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => {
                        setShowVendorForm(false);
                        resetVendorForm();
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={addVendor}
                    >
                      {editingVendorIndex !== null ? "Update Vendor" : "Add Vendor"}
                    </button>
                  </div>
                </div>
              )}

              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowEditModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? (uploadingImage || uploadingContract ? "Uploading..." : "Saving...") : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── DELETE MODAL ────────────────────────────────────────────────── */}
      {showDeleteModal && selectedStall && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Delete Stall</h2>
              <button className="modal-close" onClick={() => setShowDeleteModal(false)}>✕</button>
            </div>
            <div className="delete-confirmation">
              <div className="delete-icon">⚠️</div>
              <p>Are you sure you want to delete <strong>"{selectedStall.stallName}"</strong>?</p>
              <p className="delete-warning">This will also remove all associated products and vendors.</p>
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowDeleteModal(false)}>
                  Cancel
                </button>
                <button type="button" className="btn-danger" onClick={handleDeleteStall} disabled={isSubmitting}>
                  {isSubmitting ? "Deleting..." : "Delete Stall"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer onNavigate={onNavigate} />
    </div>
  );
}