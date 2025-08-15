export const SPECIALTIES = [
    { value: 'jardinier', label: 'Jardinier' },
    { value: 'paysagiste', label: 'Paysagiste' },
    { value: 'horticulteur', label: 'Horticulteur' },
    { value: 'electronicien', label: 'Électronicien' },
    { value: 'technicien_iot', label: 'Technicien IoT' },
    { value: 'installateur_capteurs', label: 'Installateur de capteurs' },
    { value: 'maintenance', label: 'Agent de maintenance' },
    { value: 'irrigation', label: 'Spécialiste irrigation' },
    { value: 'gestion_energie', label: 'Gestion de l'énergie' },
    { value: 'autre', label: 'Autre' }
];

// Exemple d'utilisation dans un composant Select
const SpecialtySelect = ({ value, onChange }) => {
    return (
        <select value={value} onChange={(e) => onChange(e.target.value)}>
            {SPECIALTIES.map(specialty => (
                <option key={specialty.value} value={specialty.value}>
                    {specialty.label}
                </option>
            ))}
        </select>
    );
};

export default SpecialtySelect;
