import { Box, Typography, useTheme } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { tokens } from "../../theme";
import Header from "../../components/Header";
import useMediaQuery from "@mui/material/useMediaQuery";
import api from "../../axiosConfig";
import { Formik, Form } from "formik";
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
  IconButton,
} from "@mui/material";
import { Edit as EditIcon, Delete as DeleteIcon } from "@mui/icons-material";
import { useState, useEffect } from "react";

const TaskList = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const isNonMobile = useMediaQuery("(min-width:600px)");
  const [isLoading, setIsLoading] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [agents, setAgents] = useState([]);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterAgent, setFilterAgent] = useState("");
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Charger les tâches et les agents au démarrage
  useEffect(() => {
    fetchAgents();
    fetchTasks();
  }, []);

  // Appliquer les filtres lorsque les filtres changent
  useEffect(() => {
    fetchTasks();
  }, [filterStatus, filterAgent]);

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

  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      let url = "/tasks/";
      const params = [];
      if (filterStatus) params.push(`status=${filterStatus}`);
      if (filterAgent) params.push(`assigned_to=${filterAgent}`);
      if (params.length > 0) url += `?${params.join("&")}`;
      const response = await api.get(url);
      setTasks(response.data);
    } catch (error) {
      console.error("Erreur lors du chargement des tâches :", error);
      showSnackbar("Erreur lors du chargement des tâches", "error");
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

  const getTypeLabel = (value) => {
    const types = [
      { value: "arrosage", label: "Arrosage" },
      { value: "désherbage", label: "Désherbage" },
      { value: "taillage", label: "Taillage" },
    ];
    const type = types.find((t) => t.value === value);
    return type ? type.label : value;
  };

  const getStatusLabel = (value) => {
    const statuses = [
      { value: "à_faire", label: "À faire" },
      { value: "en_cours", label: "En cours" },
      { value: "terminée", label: "Terminée" },
    ];
    const status = statuses.find((s) => s.value === value);
    return status ? status.label : value;
  };

  const getStatusColor = (status) => {
    const colors = {
      à_faire: "warning",
      en_cours: "info",
      terminée: "success",
    };
    return colors[status] || "default";
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setIsEditDialogOpen(true);
  };

  const handleDeleteTask = async (taskId) => {
    if (window.confirm("Voulez-vous vraiment supprimer cette tâche ?")) {
      try {
        setIsLoading(true);
        await api.delete(`/tasks/${taskId}/`);
        showSnackbar("Tâche supprimée avec succès", "success");
        fetchTasks(); // Rafraîchir la liste
      } catch (error) {
        console.error("Erreur lors de la suppression de la tâche :", error);
        showSnackbar("Erreur lors de la suppression de la tâche", "error");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleUpdateTask = async (values, { setSubmitting, resetForm }) => {
    try {
      setIsLoading(true);
      await api.put(`/tasks/${editingTask.id}/`, {
        ...values,
        scheduled_at: new Date(values.scheduled_at).toISOString(),
        assigned_to_id: values.assigned_to_id,
      });
      showSnackbar("Tâche modifiée avec succès", "success");
      resetForm();
      setIsEditDialogOpen(false);
      setEditingTask(null);
      fetchTasks();
    } catch (error) {
      console.error("Erreur lors de la modification de la tâche :", error);
      showSnackbar("Erreur lors de la modification de la tâche", "error");
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
    assigned_to_id: Yup.string().required("L'agent assigné est requis"),
  });

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

  const columns = [
    {
      field: "title",
      headerName: "Titre",
      flex: 1,
      renderCell: ({ row }) => (
        <Typography fontWeight="500">{row.title}</Typography>
      ),
    },
    {
      field: "type",
      headerName: "Type",
      flex: 1,
      renderCell: ({ row }) => (
        <Chip
          label={getTypeLabel(row.type)}
          color="primary"
          size="small"
          sx={{ fontWeight: 500 }}
        />
      ),
    },
    {
      field: "description",
      headerName: "Description",
      flex: 2,
      renderCell: ({ row }) => (
        <Typography color="text.secondary">{row.description}</Typography>
      ),
    },
    {
      field: "assigned_to",
      headerName: "Agent assigné",
      flex: 1,
      renderCell: ({ row }) => (
        <Box display="flex" alignItems="center">
          
          <Typography fontWeight="500">
            {row.assigned_to?.username || "Non assigné"}
          </Typography>
        </Box>
      ),
    },
    {
      field: "status",
      headerName: "Statut",
      flex: 1,
      renderCell: ({ row }) => (
        <Chip
          label={getStatusLabel(row.status)}
          color={getStatusColor(row.status)}
          size="small"
          sx={{ fontWeight: 500 }}
        />
      ),
    },
    {
      field: "scheduled_at",
      headerName: "Date prévue",
      flex: 1,
      renderCell: ({ row }) => (
        <Typography>
          {new Date(row.scheduled_at).toLocaleString()}
        </Typography>
      ),
    },
    {
      field: "done_at",
      headerName: "Date de réalisation",
      flex: 1,
      renderCell: ({ row }) => (
        <Typography>
          {row.done_at ? new Date(row.done_at).toLocaleString() : "-"}
        </Typography>
      ),
    },
    {
      field: "actions",
      headerName: "Actions",
      flex: 1,
      align: "center",
      headerAlign: "center",
      renderCell: ({ row }) => (
        <Box sx={{ display: "flex", gap: 1, justifyContent: "center" }}>
          <Tooltip title="Modifier">
            <IconButton
              onClick={() => handleEditTask(row)}
              color="primary"
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Supprimer">
            <IconButton
              onClick={() => handleDeleteTask(row.id)}
              color="error"
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  const rows = tasks.map((task) => ({
    id: task.id,
    title: task.title,
    type: task.type,
    description: task.description,
    assigned_to: task.assigned_to,
    status: task.status,
    scheduled_at: task.scheduled_at,
    done_at: task.done_at,
  }));

  return (
    <Box m="20px">
      <Header title="TÂCHES" subtitle="Gérer les tâches assignées" />
      <Box display="flex" gap={2} mb={2} flexDirection={isNonMobile ? "row" : "column"}>
        <TextField
          select
          label="Filtrer par statut"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          variant="outlined"
          sx={{ minWidth: 200 }}
        >
          <MenuItem value="">Tous</MenuItem>
          {statusOptions.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          label="Filtrer par agent"
          value={filterAgent}
          onChange={(e) => setFilterAgent(e.target.value)}
          variant="outlined"
          sx={{ minWidth: 200 }}
        >
          <MenuItem value="">Tous</MenuItem>
          {agents.map((agent) => (
            <MenuItem key={agent.id} value={agent.id}>
              {agent.username}
            </MenuItem>
          ))}
        </TextField>
      </Box>
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
          loading={isLoading}
          checkboxSelection
          disableSelectionOnClick
        />
      </Box>

      {/* Dialog pour modifier une tâche */}
      <Dialog
        open={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ pb: 1 }}>Modifier la tâche</DialogTitle>
        {editingTask && (
          <Formik
            initialValues={{
              title: editingTask.title || "",
              type: editingTask.type || "",
              description: editingTask.description || "",
              status: editingTask.status || "à_faire",
              scheduled_at: editingTask.scheduled_at
                ? new Date(editingTask.scheduled_at).toISOString().slice(0, 16)
                : "",
              assigned_to_id: editingTask.assigned_to?.id || "",
            }}
            enableReinitialize={true}
            validationSchema={validationSchema}
            onSubmit={handleUpdateTask}
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
                    <TextField
                      select
                      fullWidth
                      variant="outlined"
                      label="Agent assigné"
                      name="assigned_to_id"
                      value={values.assigned_to_id}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={!!touched.assigned_to_id && !!errors.assigned_to_id}
                      helperText={touched.assigned_to_id && errors.assigned_to_id}
                    >
                      {agents.map((agent) => (
                        <MenuItem key={agent.id} value={agent.id}>
                          {agent.username}
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
                    disabled={isSubmitting || isLoading}
                    startIcon={
                      isSubmitting || isLoading ? <CircularProgress size={20} /> : null
                    }
                  >
                    {isSubmitting || isLoading ? "Modification..." : "Modifier"}
                  </Button>
                </DialogActions>
              </Form>
            )}
          </Formik>
        )}
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

export default TaskList;