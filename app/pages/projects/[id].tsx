import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabaseClient'; // Adjust the import path as needed

interface Project {
    id: string;
    name: string;
    description: string;
    tasks: string[];
    notes: string[];
}

export default function ProjectDetails() {
    const router = useRouter();
    const { id } = router.query;
    const [project, setProject] = useState<Project | null>(null);

    useEffect(() => {
        if (id) {
            supabase
                .from('projects')
                .select('*')
                .eq('id', id)
                .single()
                .then(({ data, error }) => {
                    if (error) {
                        console.error('Error fetching project details:', error);
                    } else {
                        setProject(data);
                    }
                });
        }
    }, [id]);

    if (!project) {
        return <div>Loading...</div>;
    }

    return (
        <div>
            <h1>{project.name}</h1>
            <p>{project.description}</p>
            <div>
                <h2>Tasks</h2>
                <ul>
                    {project.tasks.map((task, index) => (
                        <li key={index}>{task}</li>
                    ))}
                </ul>
            </div>
            <div>
                <h2>Notes</h2>
                <ul>
                    {project.notes.map((note, index) => (
                        <li key={index}>{note}</li>
                    ))}
                </ul>
            </div>
        </div>
    );
} 