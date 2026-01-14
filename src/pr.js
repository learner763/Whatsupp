import React, { useState } from "react";

export default function Pr() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("");
  const [preview, setPreview] = useState("");

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const uploadFile = async () => {
    if (!file) return alert("Select a file first");

    setStatus("Uploading...");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        setStatus("Upload Complete ✅");
        setPreview(data.url);
      } else {
        setStatus("Upload Failed ❌");
      }
    } catch (err) {
      console.error(err);
      setStatus("Upload Failed ❌");
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h2>Cloudinary File Upload</h2>
      <input type="file" onChange={handleFileChange} />
      <br />
      <button onClick={uploadFile} style={{ marginTop: "10px" }}>
        Upload
      </button>
      <p>{status}</p>
      {preview && (
        <img
          src={preview}
          alt="uploaded file"
          style={{ maxWidth: "300px", marginTop: "20px" }}
        />
      )}
    </div>
  );
}
