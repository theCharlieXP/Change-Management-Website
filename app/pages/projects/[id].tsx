import { useRouter } from 'next/router';

export default function ProjectDetails() {
    const router = useRouter();
    const { id } = router.query;

    // Fetch project details using the id
    const project = fetchProjectDetails(id);

    if (!project) {
        return <div>Loading...</div>;
    }

    return (
        <div>
            <h1>{project.name}</h1>
            <p>{project.description}</p>
            <div>
                <h2>Tasks</h2>
                {/* Render tasks */}
            </div>
            <div>
                <h2>Notes</h2>
                {/* Render notes */}
            </div>
        </div>
    );
} 