// ✅ PRÉ-REQUIS
// npm install react-leaflet leaflet
// Dans index.css ou App.css :
// .leaflet-container { width: 100%; height: 150px; }

import { useState, useEffect } from "react";
import {
  Box,
  Button,
  MenuItem,
  TextField,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Alert,
  Snackbar,
  Card,
  CardContent,
  Typography,
  Tooltip,
  useTheme,
  alpha,
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Work as WorkIcon,
  MyLocation as MyLocationIcon,
} from "@mui/icons-material";
import { Formik } from "formik";
import * as yup from "yup";
import useMediaQuery from "@mui/material/useMediaQuery";
import api from "../../axiosConfig";

// 🌍 Leaflet
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix des icônes Leaflet (CRA/Vite)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const Form = () => {
  const theme = useTheme();
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
      // Conversion safe vers number si non vide
      const payload = {
        ...values,
        latitude:
          values.latitude === "" || values.latitude === null
            ? null
            : Number(values.latitude),
        longitude:
          values.longitude === "" || values.longitude === null
            ? null
            : Number(values.longitude),
      };

      await api.post("/users/", payload);
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
    try {
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

      // Inclure latitude/longitude si renseignées (y compris 0)
      if (
        values.latitude !== "" &&
        values.latitude !== null &&
        values.latitude !== undefined
      ) {
        updateData.latitude = Number(values.latitude);
      }
      if (
        values.longitude !== "" &&
        values.longitude !== null &&
        values.longitude !== undefined
      ) {
        updateData.longitude = Number(values.longitude);
      }

      await api.patch(`/users/${editingAgent.id}/`, updateData);
      showSnackbar("Agent modifié avec succès !");
      setIsEditDialogOpen(false);
      setEditingAgent(null);
      await fetchAgents();
    } catch (error) {
      console.error("Erreur de modification:", error);
      let errorMsg = "Erreur lors de la modification.";
      if (error.response?.data) {
        if (typeof error.response.data === "string") {
          errorMsg = error.response.data;
        } else if (error.response.data.detail) {
          errorMsg = error.response.data.detail;
        } else if (error.response.data.message) {
          errorMsg = error.response.data.message;
        }
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

  const detectLocation = (setFieldValue) => {
    if (!navigator.geolocation) {
      showSnackbar("Géolocalisation non supportée", "error");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFieldValue("latitude", pos.coords.latitude);
        setFieldValue("longitude", pos.coords.longitude);
        showSnackbar("Localisation détectée !");
      },
      () => {
        showSnackbar("Impossible de récupérer la position", "error");
      }
    );
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

  // Rend une mini carte Leaflet simple pour un agent (si coordonnées valides)
  const AgentMiniMap = ({ lat, lng }) => {
    const hasCoords =
      typeof lat === "number" &&
      !Number.isNaN(lat) &&
      typeof lng === "number" &&
      !Number.isNaN(lng);

    if (!hasCoords) {
      return (
        <Box
          sx={{
            width: "240px",
            height: "150px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 2,
            border: `1px dashed ${alpha(theme.palette.text.primary, 0.2)}`,
          }}
        >
          <Typography variant="caption" color="text.secondary">
            Aucune coordonnée
          </Typography>
        </Box>
      );
    }

    return (
      <Box
        sx={{ width: 240, height: 150, borderRadius: 2, overflow: "hidden" }}
      >
        <MapContainer
          center={[lat, lng]}
          zoom={13}
          scrollWheelZoom={false}
          dragging={false}
          doubleClickZoom={false}
          zoomControl={false}
          style={{ width: "100%", height: "100%" }}
        >
          <TileLayer
            // Tu peux changer de fond si besoin (OpenStreetMap par défaut)
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />
          <Marker position={[lat, lng]} />
        </MapContainer>
      </Box>
    );
  };

  return (
    <Box m="20px" maxWidth="1200px" mx="auto">
      {/* FORMULAIRE DE CRÉATION */}
      <Card
        elevation={3}
        sx={{
          mb: 4,
          background: `linear-gradient(135deg, ${alpha(
            theme.palette.primary.main,
            0.02
          )} 0%, ${alpha(theme.palette.secondary.main, 0.02)} 100%)`,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Box display="flex" alignItems="center" mb={3}>
            <AddIcon
              sx={{ mr: 2, color: theme.palette.primary.main, fontSize: 28 }}
            />
            <Box>
              <Typography variant="h4" fontWeight="600" color="primary">
                Créer un nouvel agent
              </Typography>
            </Box>
          </Box>

          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={handleFormSubmit}
          >
            {({
              values,
              errors,
              touched,
              handleBlur,
              handleChange,
              handleSubmit,
              isSubmitting,
              resetForm,
              setFieldValue,
            }) => (
              <form onSubmit={handleSubmit}>
                <Box
                  display="grid"
                  gap="24px"
                  gridTemplateColumns="repeat(4, minmax(0, 1fr))"
                  sx={{
                    "& > div": {
                      gridColumn: isNonMobile ? undefined : "span 4",
                    },
                  }}
                >
                  <TextField
                    fullWidth
                    variant="outlined"
                    type="text"
                    label="Nom d'utilisateur"
                    onBlur={handleBlur}
                    onChange={handleChange}
                    value={values.username}
                    name="username"
                    error={!!touched.username && !!errors.username}
                    helperText={touched.username && errors.username}
                    sx={{ gridColumn: "span 2" }}
                    InputProps={{
                      startAdornment: (
                        <PersonIcon sx={{ mr: 1, color: "action.active" }} />
                      ),
                    }}
                  />
                  <TextField
                    fullWidth
                    variant="outlined"
                    type="email"
                    label="Email"
                    onBlur={handleBlur}
                    onChange={handleChange}
                    value={values.email}
                    name="email"
                    error={!!touched.email && !!errors.email}
                    helperText={touched.email && errors.email}
                    sx={{ gridColumn: "span 2" }}
                    InputProps={{
                      startAdornment: (
                        <EmailIcon sx={{ mr: 1, color: "action.active" }} />
                      ),
                    }}
                  />
                  <TextField
                    fullWidth
                    variant="outlined"
                    type="password"
                    label="Mot de passe"
                    onBlur={handleBlur}
                    onChange={handleChange}
                    value={values.password}
                    name="password"
                    error={!!touched.password && !!errors.password}
                    helperText={touched.password && errors.password}
                    sx={{ gridColumn: "span 2" }}
                  />
                  <TextField
                    select
                    fullWidth
                    variant="outlined"
                    label="Spécialité"
                    onBlur={handleBlur}
                    onChange={handleChange}
                    value={values.specialty}
                    name="specialty"
                    error={!!touched.specialty && !!errors.specialty}
                    helperText={touched.specialty && errors.specialty}
                    sx={{ gridColumn: "span 2" }}
                    InputProps={{
                      startAdornment: (
                        <WorkIcon sx={{ mr: 1, color: "action.active" }} />
                      ),
                    }}
                  >
                    {specialties.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>

                  {/* Localisation */}
                  <TextField
                    fullWidth
                    variant="outlined"
                    type="number"
                    label="Latitude"
                    onBlur={handleBlur}
                    onChange={handleChange}
                    value={values.latitude}
                    name="latitude"
                    error={!!touched.latitude && !!errors.latitude}
                    helperText={touched.latitude && errors.latitude}
                    sx={{ gridColumn: "span 2" }}
                    inputProps={{ step: "any" }}
                  />
                  <TextField
                    fullWidth
                    variant="outlined"
                    type="number"
                    label="Longitude"
                    onBlur={handleBlur}
                    onChange={handleChange}
                    value={values.longitude}
                    name="longitude"
                    error={!!touched.longitude && !!errors.longitude}
                    helperText={touched.longitude && errors.longitude}
                    sx={{ gridColumn: "span 2" }}
                    inputProps={{ step: "any" }}
                  />

                  <Button
                    variant="outlined"
                    startIcon={<MyLocationIcon />}
                    onClick={() => detectLocation(setFieldValue)}
                    sx={{ gridColumn: "span 4" }}
                  >
                    Détecter ma position
                  </Button>
                </Box>

                <Box display="flex" justifyContent="end" mt="32px" gap={2}>
                  <Button
                    type="button"
                    color="inherit"
                    variant="outlined"
                    onClick={() => resetForm()}
                    disabled={isSubmitting || isLoading}
                    size="large"
                  >
                    Réinitialiser
                  </Button>
                  <Button
                    type="submit"
                    color="primary"
                    variant="contained"
                    disabled={isSubmitting || isLoading}
                    startIcon={
                      isLoading ? <CircularProgress size={20} /> : <AddIcon />
                    }
                    size="large"
                    sx={{ minWidth: 160 }}
                  >
                    {isLoading ? "Création..." : "Créer l'agent"}
                  </Button>
                </Box>
              </form>
            )}
          </Formik>
        </CardContent>
      </Card>

      {/* LISTE DES AGENTS */}
      <Card elevation={3}>
        <CardContent sx={{ p: 0 }}>
          <Box p={3} pb={0}>
            <Box>
              <Typography variant="h4" fontWeight="600" color="primary" mb={1}>
                Agents enregistrés ({agents.length})
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Gérez vos agents et leurs informations
              </Typography>
            </Box>
          </Box>

          {agents.length === 0 ? (
            <Box p={4} textAlign="center">
              <PersonIcon
                sx={{ fontSize: 64, color: "action.disabled", mb: 2 }}
              />
              <Typography variant="h6" color="text.secondary">
                Aucun agent enregistré pour le moment
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Créez votre premier agent avec le formulaire ci-dessus
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow
                    sx={{
                      backgroundColor: alpha(theme.palette.primary.main, 0.05),
                    }}
                  >
                    <TableCell sx={{ fontWeight: 600, py: 2 }}>Agent</TableCell>
                    <TableCell sx={{ fontWeight: 600, py: 2 }}>Email</TableCell>
                    <TableCell sx={{ fontWeight: 600, py: 2 }}>
                      Spécialité
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, py: 2 }}>
                      Latitude
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, py: 2 }}>
                      Longitude
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, py: 2 }}>Carte</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600, py: 2 }}>
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {agents.map((agent, index) => {
                    const lat =
                      typeof agent.latitude === "number"
                        ? agent.latitude
                        : agent.latitude
                        ? Number(agent.latitude)
                        : null;
                    const lng =
                      typeof agent.longitude === "number"
                        ? agent.longitude
                        : agent.longitude
                        ? Number(agent.longitude)
                        : null;

                    return (
                      <TableRow
                        key={agent.id}
                        sx={{
                          "&:hover": {
                            backgroundColor: alpha(
                              theme.palette.primary.main,
                              0.02
                            ),
                          },
                          borderBottom:
                            index === agents.length - 1 ? "none" : undefined,
                        }}
                      >
                        <TableCell sx={{ py: 2 }}>
                          <Box display="flex" alignItems="center">
                            <Box
                              sx={{
                                width: 40,
                                height: 40,
                                borderRadius: "50%",
                                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                mr: 2,
                                color: "white",
                                fontWeight: 600,
                              }}
                            >
                              {agent.username?.charAt(0)?.toUpperCase()}
                            </Box>
                            <Typography fontWeight="500">
                              {agent.username}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ py: 2 }}>
                          <Typography color="text.secondary">
                            {agent.email}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ py: 2 }}>
                          <Chip
                            label={getSpecialtyLabel(agent.specialty)}
                            color={getSpecialtyColor(agent.specialty)}
                            size="small"
                            sx={{ fontWeight: 500 }}
                          />
                        </TableCell>
                        <TableCell sx={{ py: 2 }}>
                          <Typography variant="body2" color="text.secondary">
                            {lat ?? "—"}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ py: 2 }}>
                          <Typography variant="body2" color="text.secondary">
                            {lng ?? "—"}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ py: 2 }}>
                          <AgentMiniMap lat={lat} lng={lng} />
                        </TableCell>
                        <TableCell align="center" sx={{ py: 2 }}>
                          <Box display="flex" justifyContent="center" gap={1}>
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
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

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
              latitude:
                editingAgent.latitude === 0 ? 0 : editingAgent.latitude ?? "",
              longitude:
                editingAgent.longitude === 0 ? 0 : editingAgent.longitude ?? "",
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
              setFieldValue,
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

                    {/* Localisation (édition) */}
                    <Box display="grid" gap={2} gridTemplateColumns="1fr 1fr">
                      <TextField
                        fullWidth
                        variant="outlined"
                        type="number"
                        label="Latitude"
                        name="latitude"
                        value={values.latitude}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={!!touched.latitude && !!errors.latitude}
                        helperText={touched.latitude && errors.latitude}
                        inputProps={{ step: "any" }}
                      />
                      <TextField
                        fullWidth
                        variant="outlined"
                        type="number"
                        label="Longitude"
                        name="longitude"
                        value={values.longitude}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={!!touched.longitude && !!errors.longitude}
                        helperText={touched.longitude && errors.longitude}
                        inputProps={{ step: "any" }}
                      />
                      <Button
                        variant="outlined"
                        startIcon={<MyLocationIcon />}
                        onClick={() => detectLocation(setFieldValue)}
                        sx={{ gridColumn: "span 2" }}
                      >
                        Détecter ma position
                      </Button>
                    </Box>
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

      {/* SNACKBAR */}
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

// Transform helper: convertit "" -> undefined pour laisser passer "nullable"
const numberOrNull = (v, o) => {
  if (
    o.originalValue === "" ||
    o.originalValue === null ||
    o.originalValue === undefined
  )
    return null;
  const n = Number(o.originalValue);
  return Number.isNaN(n) ? NaN : n;
};

const validationSchema = yup.object().shape({
  username: yup
    .string()
    .min(3, "Le nom doit contenir au moins 3 caractères")
    .max(100, "Le nom ne doit pas dépasser 100 caractères")
    .required("Nom d'utilisateur requis"),
  email: yup.string().email("Adresse email invalide").required("Email requis"),
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
  latitude: yup
    .number()
    .transform(numberOrNull)
    .nullable()
    .min(-90, "Latitude minimale -90")
    .max(90, "Latitude maximale 90"),
  longitude: yup
    .number()
    .transform(numberOrNull)
    .nullable()
    .min(-180, "Longitude minimale -180")
    .max(180, "Longitude maximale 180"),
});

const editValidationSchema = yup.object().shape({
  username: yup
    .string()
    .min(3, "Le nom doit contenir au moins 3 caractères")
    .max(100, "Le nom ne doit pas dépasser 100 caractères")
    .required("Nom d'utilisateur requis"),
  email: yup.string().email("Adresse email invalide").required("Email requis"),
  specialty: yup.string().required("Spécialité requise"),
  latitude: yup
    .number()
    .transform(numberOrNull)
    .nullable()
    .min(-90, "Latitude minimale -90")
    .max(90, "Latitude maximale 90"),
  longitude: yup
    .number()
    .transform(numberOrNull)
    .nullable()
    .min(-180, "Longitude minimale -180")
    .max(180, "Longitude maximale 180"),
});

const initialValues = {
  username: "",
  email: "",
  password: "",
  specialty: "autre",
  latitude: "",
  longitude: "",
};

export default Form;
