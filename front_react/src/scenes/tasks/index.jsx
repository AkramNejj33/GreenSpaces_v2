import { Box, Typography, useTheme } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { tokens } from "../../theme";
import Header from "../../components/Header";
import useMediaQuery from "@mui/material/useMediaQuery";
import api from "../../axiosConfig";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import {
  Button,
  MenuItem,
  TextField,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Alert,
  Snackbar,
  Tooltip,
} from "@mui/material";
import { useState, useEffect } from "react";

const Tasks = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const isNonMobile = useMediaQuery("(min-width:600px)");
  const [isLoading, setIsLoading] = useState(false);
  const [agents, setAgents] = useState([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(null);
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
      setIsLoading(true);
      const response = await api.get("/users/");
      setAgents(response.data);
    } catch (error) {
      console.error("Erreur lors du chargement des agents :", error);
      showSnackbar("Erreur lors du chargement des agents", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
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

  const typeOptions = [
    { value: "arrosage", label: "Arrosage" },
    { value: "désherbage", label: "Désherbage" },
    { value: "taillage", label: "Taillage" },
  ];

  const statusOptions = [
    { value: "à_faire", label: "À faire" },
    { value: "en_cours", label: "En cours" },
    { value: "terminée", label: "Terminée" },
  ];

  const handleAssignTask = (agent) => {
    setSelectedAgent(agent);
    setIsCreateDialogOpen(true);
  };

  const handleCreateTask = async (values, { setSubmitting, resetForm }) => {
    try {
      setIsLoading(true);
      await api.post("/tasks/", {
        ...values,
        scheduled_at: new Date(values.scheduled_at).toISOString(),
        assigned_to_id: selectedAgent.id,
      });
      showSnackbar("Tâche assignée avec succès", "success");
      resetForm();
      setIsCreateDialogOpen(false);
      setSelectedAgent(null);
    } catch (error) {
      console.error("Erreur lors de l'assignation de la tâche :", error);
      showSnackbar("Erreur lors de l'assignation de la tâche", "error");
    } finally {
      setIsLoading(false);
      setSubmitting(false);
    }
  };

  // Schéma de validation Yup
  const validationSchema = Yup.object({
    title: Yup.string().required("Le titre est requis"),
    type: Yup.string().required("Le type est requis"),
    description: Yup.string().required("La description est requise"),
    status: Yup.string().required("Le statut est requis"),
    scheduled_at: Yup.date().required("La date prévue est requise").nullable(),
  });

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
      field: "taches",
      headerName: "Tâches",
      flex: 1,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => {
        const agent = params.row;
        return (
          <Box
            sx={{ py: 2, display: "flex", justifyContent: "center", gap: 1 }}
          >
            <Tooltip title="Assigner une tâche">
              <Button
                onClick={() => handleAssignTask(agent)}
                variant="contained"
                color="error"
                size="small"
                sx={{ textTransform: "none" }}
              >
                Assigner une tâche
              </Button>
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
        <DataGrid showToolbar rows={rows} columns={columns} />
      </Box>

      {/* Dialog pour assigner une tâche */}
      <Dialog
        open={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ pb: 1 }}>
          Assigner une tâche à {selectedAgent?.username}
        </DialogTitle>
        <Formik
          initialValues={{
            title: "",
            type: "",
            description: "",
            status: "à_faire",
            scheduled_at: "",
          }}
          validationSchema={validationSchema}
          onSubmit={handleCreateTask}
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
            <Form onSubmit={handleSubmit}>
              <DialogContent sx={{ pt: 2 }}>
                <Box display="flex" flexDirection="column" gap={3}>
                  <TextField
                    fullWidth
                    variant="outlined"
                    label="Titre"
                    name="title"
                    value={values.title}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={!!touched.title && !!errors.title}
                    helperText={touched.title && errors.title}
                  />
                  <TextField
                    select
                    fullWidth
                    variant="outlined"
                    label="Type"
                    name="type"
                    value={values.type}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={!!touched.type && !!errors.type}
                    helperText={touched.type && errors.type}
                  >
                    {typeOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    fullWidth
                    variant="outlined"
                    label="Description"
                    name="description"
                    multiline
                    rows={4}
                    value={values.description}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={!!touched.description && !!errors.description}
                    helperText={touched.description && errors.description}
                  />

                  <TextField
                    fullWidth
                    variant="outlined"
                    label="Date prévue"
                    name="scheduled_at"
                    type="datetime-local"
                    value={values.scheduled_at}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    InputLabelProps={{ shrink: true }}
                    error={!!touched.scheduled_at && !!errors.scheduled_at}
                    helperText={touched.scheduled_at && errors.scheduled_at}
                  />
                </Box>
              </DialogContent>
              <DialogActions sx={{ p: 3, pt: 2 }}>
                <Button
                  onClick={() => setIsCreateDialogOpen(false)}
                  color="inherit"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={isSubmitting || isLoading}
                  startIcon={
                    isSubmitting || isLoading ? (
                      <CircularProgress size={20} />
                    ) : null
                  }
                >
                  {isSubmitting || isLoading ? "Envoi..." : "Assigner"}
                </Button>
              </DialogActions>
            </Form>
          )}
        </Formik>
      </Dialog>

      {/* Snackbar pour les notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Tasks;
