import { useHistory } from 'react-router-dom';

function ProjectList({ projects }) {
    const history = useHistory();

    const handleProjectClick = (projectId) => {
        history.push(`/projects/${projectId}`);
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