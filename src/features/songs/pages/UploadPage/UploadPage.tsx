import { SongUploadForm } from "@/features/songs";
import { Header } from "@/shared/layout";
import { Button } from "@/shared/components";
import { useNavigate } from "react-router-dom";

export const UploadPage = () => {
  const navigate = useNavigate();

  return (
    <>
      <Header />
      <div style={{ maxWidth: "600px", margin: "0 auto" }}>
        <SongUploadForm />
        <Button variant="outlined" size="large" onClick={() => navigate("/")}>
          Cancel Upload
        </Button>
      </div>
    </>
  );
};
