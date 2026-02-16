interface FileSelectProps {
    onFileSelect: (file: File) => void;
    accept: string; // e.g. "audio/*" or "image/*"
    label?: string;
}

export const FileSelect = ({ onFileSelect, accept, label = "Choose File" }: FileSelectProps) => {
    return (
        <div className="file-select-wrapper">
            <label style={{ cursor: 'pointer', padding: '10px', background: '#ddd', borderRadius: '4px' }}>
                {label}
                <input 
                    type="file" 
                    accept={accept} 
                    style={{ display: 'none' }}
                    onChange={(e) => {
                        if (e.target.files?.[0]) {
                            onFileSelect(e.target.files[0]);
                        }
                    }} 
                />
            </label>
        </div>
    );
};