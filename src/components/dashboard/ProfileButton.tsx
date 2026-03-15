import { useNavigate } from "react-router-dom";

const ProfileButton = () => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate("/profile")}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-xs font-semibold text-foreground transition-colors hover:bg-muted"
      aria-label="Open profile"
    >
      BY
    </button>
  );
};

export default ProfileButton;
