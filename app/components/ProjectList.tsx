import { useRouter } from 'next/navigation';

interface Project {
    id: string;
    name: string;
}

function ProjectList({ projects }: { projects: Project[] }) {
    const router = useRouter();

    const handleProjectClick = (projectId: string) => {
        router.push(`/hybrid-project/${projectId}`);
    };

    return (
        <div>
            {projects.map(project => (
                <div key={project.id} onClick={() => handleProjectClick(project.id)}>
                    {project.name}
                </div>
            ))}
        </div>
    );
}

export default ProjectList; 