import { Box, Typography, useTheme } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { tokens } from "../../theme";
import Header from "../../components/Header";
import useMediaQuery from "@mui/material/useMediaQuery";
import api from "../../axiosConfig";
import { Formik } from "formik";
import * as yup from "yup";


import {
  Button,
  MenuItem,
  TextField,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip,
  Alert,
  Snackbar,
  Tooltip,
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Work as WorkIcon,
} from "@mui/icons-material";
import { useState, useEffect } from "react";

const Team = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const isNonMobile = useMediaQuery("(min-width:600px)");
  const [isLoading, setIsLoading] = useState(false);
  const [agents, setAgents] = useState([]);
  const [editingAgent, setEditingAgent] = useState(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [agentToDelete, setAgentToDelete] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Charger les agents au démarrage
  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      const response = await api.get("/users/");
      setAgents(response.data);
    } catch (error) {
      console.error("Erreur lors du chargement des agents :", error);
      showSnackbar("Erreur lors du chargement des agents", "error");
    }
  };

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleFormSubmit = async (values, { resetForm, setSubmitting }) => {
    setIsLoading(true);
    try {
      await api.post("/users/", values);
      showSnackbar("Agent créé avec succès !");
      resetForm();
      await fetchAgents();
    } catch (error) {
      const errorMsg =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        "Une erreur est survenue lors de la création de l'agent.";
      showSnackbar(errorMsg, "error");
    } finally {
      setIsLoading(false);
      setSubmitting(false);
    }
  };

  const handleEditAgent = (agent) => {
    setEditingAgent(agent);
    setIsEditDialogOpen(true);
  };

  const handleUpdateAgent = async (values, { setSubmitting }) => {
    console.log("Données à modifier:", values);
    console.log("ID de l'agent:", editingAgent.id);

    try {
      // Préparation des données - on enlève les champs vides
      const updateData = {};

      if (values.username && values.username.trim()) {
        updateData.username = values.username.trim();
      }
      if (values.email && values.email.trim()) {
        updateData.email = values.email.trim();
      }
      if (values.specialty) {
        updateData.specialty = values.specialty;
      }

      console.log("Données envoyées à l'API:", updateData);

      // Requête PATCH au lieu de PUT (plus approprié pour modification partielle)
      const response = await api.patch(
        `/users/${editingAgent.id}/`,
        updateData
      );
      console.log("Réponse de modification:", response.data);

      showSnackbar("Agent modifié avec succès !");
      setIsEditDialogOpen(false);
      setEditingAgent(null);
      await fetchAgents();
    } catch (error) {
      console.error("Erreur de modification:", error);
      console.error("Réponse d'erreur:", error.response?.data);
      console.error("Status:", error.response?.status);
      console.error("Headers:", error.response?.headers);

      let errorMsg = "Erreur lors de la modification.";

      if (error.response?.data) {
        if (typeof error.response.data === "string") {
          errorMsg = error.response.data;
        } else if (error.response.data.detail) {
          errorMsg = error.response.data.detail;
        } else if (error.response.data.message) {
          errorMsg = error.response.data.message;
        } else if (error.response.data.non_field_errors) {
          errorMsg = error.response.data.non_field_errors.join(", ");
        } else {
          // Afficher les erreurs de champs spécifiques
          const fieldErrors = [];
          Object.keys(error.response.data).forEach((field) => {
            if (Array.isArray(error.response.data[field])) {
              fieldErrors.push(
                `${field}: ${error.response.data[field].join(", ")}`
              );
            } else if (typeof error.response.data[field] === "string") {
              fieldErrors.push(`${field}: ${error.response.data[field]}`);
            }
          });
          if (fieldErrors.length > 0) {
            errorMsg = fieldErrors.join(" | ");
          }
        }
      } else if (error.response?.status === 400) {
        errorMsg = "Données invalides. Vérifiez les champs saisis.";
      } else if (error.response?.status === 404) {
        errorMsg = "Agent non trouvé.";
      } else if (error.response?.status === 403) {
        errorMsg = "Permission refusée.";
      }

      showSnackbar(errorMsg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAgent = (agent) => {
    setAgentToDelete(agent);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteAgent = async () => {
    try {
      await api.delete(`/users/${agentToDelete.id}/`);
      showSnackbar("Agent supprimé avec succès !");
      setIsDeleteDialogOpen(false);
      setAgentToDelete(null);
      await fetchAgents();
    } catch (error) {
      showSnackbar("Erreur lors de la suppression", "error");
    }
  };

  const getSpecialtyLabel = (value) => {
    const specialty = specialties.find((s) => s.value === value);
    return specialty ? specialty.label : value;
  };

  const getSpecialtyColor = (specialty) => {
    const colors = {
      jardinier: "success",
      paysagiste: "primary",
      horticulteur: "secondary",
      electronicien: "warning",
      technicien_iot: "info",
      installateur_capteurs: "error",
      maintenance: "default",
      irrigation: "primary",
      gestion_energie: "success",
      autre: "default",
    };
    return colors[specialty] || "default";
  };
  const specialties = [
    { value: "jardinier", label: "Jardinier" },
    { value: "paysagiste", label: "Paysagiste" },
    { value: "horticulteur", label: "Horticulteur" },
    { value: "electronicien", label: "Électronicien" },
    { value: "technicien_iot", label: "Technicien IoT" },
    { value: "installateur_capteurs", label: "Installateur de capteurs" },
    { value: "maintenance", label: "Agent de maintenance" },
    { value: "irrigation", label: "Spécialiste irrigation" },
    { value: "gestion_energie", label: "Gestion de l'énergie" },
    { value: "autre", label: "Autre" },
  ];

  const columns = [
    {
      field: "username",
      headerName: "Agent",
      flex: 1,
      cellClassName: "name-column--cell",
      renderCell: ({ row }) => (
        <Box display="flex" alignItems="center">
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: (theme) =>
                `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mr: 2,
              color: "white",
              fontWeight: 600,
            }}
          >
            {row.username.charAt(0).toUpperCase()}
          </Box>
          <Typography fontWeight="500">{row.username}</Typography>
        </Box>
      ),
    },
    {
      field: "email",
      headerName: "Email",
      flex: 1,
      renderCell: ({ row }) => (
        <Typography color="text.secondary">{row.email}</Typography>
      ),
    },
    {
      field: "specialty",
      headerName: "Spécialité",
      flex: 1,
      renderCell: ({ row }) => (
        <Chip
          label={getSpecialtyLabel(row.specialty)}
          color={getSpecialtyColor(row.specialty)}
          size="small"
          sx={{ fontWeight: 500 }}
        />
      ),
    },
    {
      field: "actions",
      headerName: "Actions",
      flex: 1,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => {
        const agent = params.row; // Accès à l'agent depuis les données de l'API
        return (
          <Box
            sx={{ py: 2, display: "flex", justifyContent: "center", gap: 1 }}
          >
            <Tooltip title="Modifier">
              <IconButton
                onClick={() => handleEditAgent(agent)}
                color="primary"
                size="small"
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Supprimer">
              <IconButton
                onClick={() => handleDeleteAgent(agent)}
                color="error"
                size="small"
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        );
      },
    },
  ];

  const rows = agents.map((agent) => ({
    id: agent.id,
    username: agent.username,
    email: agent.email,
    specialty: agent.specialty,
  }));

  return (
    <Box m="20px">
      <Header title="TEAM" subtitle="Managing the Team Members" />
      <Box
        m="40px 0 0 0"
        height="75vh"
        sx={{
          "& .MuiDataGrid-root": {
            border: "none",
          },
          "& .MuiDataGrid-cell": {
            borderBottom: "none",
          },
          "& .name-column--cell": {
            color: colors.greenAccent[300],
          },
          "& .MuiDataGrid-columnHeaders": {
            backgroundColor: colors.blueAccent[700],
            borderBottom: "none",
          },
          "& .MuiDataGrid-virtualScroller": {
            backgroundColor: colors.primary[400],
          },
          "& .MuiDataGrid-footerContainer": {
            borderTop: "none",
            backgroundColor: colors.blueAccent[700],
          },
          "& .MuiCheckbox-root": {
            color: `${colors.greenAccent[200]} !important`,
          },
        }}
      >
        <DataGrid
          rows={rows}
          columns={columns}
          showToolbar
        />
      </Box>

      {/* DIALOG DE MODIFICATION */}
      <Dialog
        open={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ pb: 1 }}>Modifier l'agent</DialogTitle>
        {editingAgent && (
          <Formik
            initialValues={{
              username: editingAgent.username || "",
              email: editingAgent.email || "",
              specialty: editingAgent.specialty || "autre",
            }}
            validationSchema={editValidationSchema}
            enableReinitialize={true}
            onSubmit={handleUpdateAgent}
          >
            {({
              values,
              errors,
              touched,
              handleBlur,
              handleChange,
              handleSubmit,
              isSubmitting,
            }) => (
              <form onSubmit={handleSubmit}>
                <DialogContent sx={{ pt: 2 }}>
                  <Box display="flex" flexDirection="column" gap={3}>
                    <TextField
                      fullWidth
                      variant="outlined"
                      label="Nom d'utilisateur"
                      name="username"
                      value={values.username}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={!!touched.username && !!errors.username}
                      helperText={touched.username && errors.username}
                    />
                    <TextField
                      fullWidth
                      variant="outlined"
                      label="Email"
                      name="email"
                      type="email"
                      value={values.email}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={!!touched.email && !!errors.email}
                      helperText={touched.email && errors.email}
                    />
                    <TextField
                      select
                      fullWidth
                      variant="outlined"
                      label="Spécialité"
                      name="specialty"
                      value={values.specialty}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={!!touched.specialty && !!errors.specialty}
                      helperText={touched.specialty && errors.specialty}
                    >
                      {specialties.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Box>
                </DialogContent>
                <DialogActions sx={{ p: 3, pt: 2 }}>
                  <Button
                    onClick={() => setIsEditDialogOpen(false)}
                    color="inherit"
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={isSubmitting}
                    startIcon={
                      isSubmitting ? <CircularProgress size={20} /> : null
                    }
                  >
                    {isSubmitting ? "Modification..." : "Modifier"}
                  </Button>
                </DialogActions>
              </form>
            )}
          </Formik>
        )}
      </Dialog>

      {/* DIALOG DE CONFIRMATION DE SUPPRESSION */}
      <Dialog
        open={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <Typography>
            Êtes-vous sûr de vouloir supprimer l'agent{" "}
            <strong>{agentToDelete?.username}</strong> ? Cette action est
            irréversible.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button onClick={() => setIsDeleteDialogOpen(false)}>Annuler</Button>
          <Button
            onClick={confirmDeleteAgent}
            color="error"
            variant="contained"
          >
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>

      {/* SNACKBAR POUR LES NOTIFICATIONS */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};
const validationSchema = yup.object().shape({
  username: yup
    .string()
    .min(3, "Le nom doit contenir au moins 3 caractères")
    .max(100, "Le nom ne doit pas dépasser 100 caractères")
    .required("Nom d'utilisateur requis"),
  email: yup
    .string()
    .email("Adresse email invalide")
    .required("Email requis"),
  password: yup
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères")
    .max(128, "Le mot de passe ne doit pas dépasser 128 caractères")
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Doit contenir au moins une majuscule, une minuscule et un chiffre"
    )
    .required("Mot de passe requis"),
  specialty: yup.string().required("Spécialité requise"),
});

const editValidationSchema = yup.object().shape({
  username: yup
    .string()
    .min(3, "Le nom doit contenir au moins 3 caractères")
    .max(100, "Le nom ne doit pas dépasser 100 caractères")
    .required("Nom d'utilisateur requis"),
  email: yup
    .string()
    .email("Adresse email invalide")
    .required("Email requis"),
  specialty: yup
    .string()
    .required("Spécialité requise"),
});

// Schema alternatif si vous voulez permettre la modification du mot de passe

/* const editValidationSchemaWithPassword = yup.object().shape({
  username: yup
    .string()
    .min(3, "Le nom doit contenir au moins 3 caractères")
    .max(100, "Le nom ne doit pas dépasser 100 caractères")
    .required("Nom d'utilisateur requis"),
  email: yup
    .string()
    .email("Adresse email invalide")
    .required("Email requis"),
  password: yup
    .string()
    .nullable()
    .notRequired()
    .when('password', {
      is: (value) => value && value.length > 0,
      then: yup
        .string()
        .min(8, "Le mot de passe doit contenir au moins 8 caractères")
        .max(128, "Le mot de passe ne doit pas dépasser 128 caractères")
        .matches(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
          "Doit contenir au moins une majuscule, une minuscule et un chiffre"
        ),
      otherwise: yup.string().notRequired()
    }),
  specialty: yup
    .string()
    .required("Spécialité requise"),
}); */

const initialValues = {
  username: "",
  email: "",
  password: "",
  specialty: "autre",
};

export default Team;
