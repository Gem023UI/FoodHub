import "../styles/StallCard.css";
import tupLogo from "../../images/Logo.png";

interface StallCardProps {
  stall: {
    _id: string;
    stallName: string;
    stallDescription?: string;
    stallPicture?: string | null;
    section: number;
    status?: boolean;
    openHours?: {
      openTime: string;
      closingTime: string;
    };
  };
  onClick: () => void;
}

export function StallCard({ stall, onClick }: StallCardProps) {
  const imageUrl = stall.stallPicture || tupLogo;

  return (
    <div className="stall-card" onClick={onClick}>
      <div className="stall-card-image-wrap">
        <img src={imageUrl} alt={stall.stallName} className="stall-card-image" />
        {stall.status && <span className="stall-card-badge">Open</span>}
      </div>
      <div className="stall-card-info">
        <h3 className="stall-card-name">{stall.stallName}</h3>
        {stall.stallDescription && (
          <p className="stall-card-desc">{stall.stallDescription}</p>
        )}
        <p className="stall-card-section">Section {stall.section}</p>
        {stall.openHours && (
          <p className="stall-card-hours">
            <i className="fas fa-clock"></i> {stall.openHours.openTime} - {stall.openHours.closingTime}
          </p>
        )}
      </div>
    </div>
  );
}