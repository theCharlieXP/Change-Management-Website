import { useRouter } from 'next/router';

interface Project {
    id: string;
    name: string;
    description: string;
}

function ProjectItem({ project }: { project: Project }) {
    const router = useRouter();

    const handleClick = () => {
        router.push(`/projects/${project.id}`);
    };

    return (
        <div onClick={handleClick} className="project-item">
            <h3>{project.name}</h3>
            <p>{project.description}</p>
        </div>
    );
}

export default ProjectItem; 