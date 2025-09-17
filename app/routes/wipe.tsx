import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { usePuterStore } from "~/lib/puter";

const WipeApp = () => {
    const { auth, isLoading, error, fs, kv } = usePuterStore();
    const navigate = useNavigate();
    const [files, setFiles] = useState<FSItem[]>([]);
    const [isWiping, setIsWiping] = useState(false);

    const loadFiles = async () => {
        const files = (await fs.readDir("./")) as FSItem[];
        setFiles(files);
    };

    useEffect(() => {
        loadFiles();
    }, []);

    useEffect(() => {
        if (!isLoading && !auth.isAuthenticated) {
            navigate("/auth?next=/wipe");
        }
    }, [isLoading]);

    const handleDelete = async () => {
        setIsWiping(true);
        for (const file of files) {
            await fs.delete(file.path);
        }
        await kv.flush();
        await loadFiles();
        setIsWiping(false);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen text-gray-600">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-400 border-t-transparent mr-2"></div>
                Loading...
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-md mx-auto mt-10 p-4 border border-red-300 bg-red-50 text-red-700 rounded-md">
                <h2 className="font-semibold mb-1">Error</h2>
                <p>{error}</p>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto p-6 space-y-6">
            <div className="border rounded-xl shadow-sm bg-white p-6">
                <h1 className="text-2xl font-bold mb-2">App Data Wipe</h1>
                <p className="text-sm text-gray-600 mb-4">
                    Authenticated as{" "}
                    <span className="font-medium text-gray-800">
            {auth.user?.username}
          </span>
                </p>

                <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-2">Existing Files</h3>
                    {files.length > 0 ? (
                        <div className="border rounded-md divide-y">
                            {files.map((file) => (
                                <div
                                    key={file.id}
                                    className="flex justify-between items-center p-3 hover:bg-gray-50"
                                >
                                    <p className="text-sm font-medium">{file.name}</p>
                                    <span className="text-xs text-gray-500">{file.path}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-400 italic">No files found</p>
                    )}
                </div>

                <button
                    onClick={handleDelete}
                    disabled={isWiping}
                    className={`px-4 py-2 rounded-md text-white font-medium transition ${
                        isWiping
                            ? "bg-red-400 cursor-not-allowed"
                            : "bg-red-600 hover:bg-red-700"
                    }`}
                >
                    {isWiping ? "Wiping..." : "Wipe App Data"}
                </button>
            </div>
        </div>
    );
};

export default WipeApp;
