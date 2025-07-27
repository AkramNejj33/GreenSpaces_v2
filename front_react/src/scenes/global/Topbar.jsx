import { 
  Box, 
  IconButton, 
  useTheme, 
  Menu, 
  MenuItem, 
  Typography,
  Divider 
} from "@mui/material";
import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ColorModeContext, tokens } from "../../theme";
import { useAuth } from "../../AuthContext";
import InputBase from "@mui/material/InputBase";
import LightModeOutlined from "@mui/icons-material/LightModeOutlined";
import DarkModeOutlined from "@mui/icons-material/DarkModeOutlined";
import NotificationsOutlined from "@mui/icons-material/NotificationsOutlined";
import SettingsOutlined from "@mui/icons-material/SettingsOutlined";
import PersonOutlined from "@mui/icons-material/PersonOutlined";
import SearchIcon from "@mui/icons-material/Search";
import LogoutOutlined from "@mui/icons-material/LogoutOutlined";
import AccountCircleOutlined from "@mui/icons-material/AccountCircleOutlined";
import ManageAccountsOutlined from "@mui/icons-material/ManageAccountsOutlined";
import LockOutlined from "@mui/icons-material/LockOutlined";

const Topbar = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const colorMode = useContext(ColorModeContext);
  const navigate = useNavigate();
  const { logout } = useAuth();
  
  // État pour le menu dropdown du profil
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  // Ouvrir le menu au clic sur l'icône profil
  const handleProfileClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  // Fermer le menu
  const handleClose = () => {
    setAnchorEl(null);
  };

  // Gérer les actions du menu
  const handlePersonalInfo = () => {
    handleClose();
    console.log("Naviguer vers Info Personnel");
    // navigate('/profile'); // Si vous avez une page de profil
  };

  const handleChangePassword = () => {
    handleClose();
    console.log("Naviguer vers Change Password");
    navigate('/change-password');
  };

  const handleSettings = () => {
    handleClose();
    console.log("Naviguer vers Paramètres");
    // navigate('/settings'); // Si vous avez une page de paramètres
  };

  const handleLogout = async () => {
    handleClose();
    
    console.log('=== DÉBUT DÉCONNEXION ===');
    
    try {
      console.log('Envoi de la requête logout vers le backend...');
      
      // Envoyer la requête de déconnexion au backend
      const response = await fetch('http://127.0.0.1:8000/api/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include', // Important : inclut les cookies automatiquement
      });

      console.log('Status de la réponse logout:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Déconnexion backend réussie:', data.message);
      } else {
        console.warn('⚠️ Erreur lors du logout backend (status:', response.status, '), mais on continue la déconnexion locale');
        
        // Log des détails de l'erreur
        try {
          const errorData = await response.json();
          console.warn('Détails erreur backend:', errorData);
        } catch (parseError) {
          console.warn('Impossible de parser la réponse d\'erreur');
        }
      }
    } catch (error) {
      console.error('❌ Erreur réseau lors de la déconnexion backend:', error);
      console.log('On continue avec la déconnexion locale...');
    }
    
    // Utiliser la fonction logout du contexte qui nettoie tout
    logout();
    
    console.log('✅ Données locales nettoyées via AuthContext');
    console.log('=== FIN DÉCONNEXION ===');
    
    // Rediriger vers la page de login
    navigate('/login', { replace: true });
  };

  return (
    <Box display="flex" justifyContent="space-between" p={2}>
      {/* left side */}
      <Box
        display="flex"
        backgroundColor={colors.primary[400]}
        borderRadius="3px"
      >
        <InputBase sx={{ ml: 2, flex: 1 }} placeholder="Search" />
        <IconButton type="button" sx={{ p: 1 }}>
          <SearchIcon />
        </IconButton>
      </Box>
      
      {/* right side */}
      <Box display="flex">
        <IconButton onClick={colorMode.toggleColorMode}>
          {theme.palette.mode === "dark" ? (
            <DarkModeOutlined />
          ) : (
            <LightModeOutlined />
          )}
        </IconButton>
        <IconButton>
          <NotificationsOutlined />
        </IconButton>
        <IconButton>
          <SettingsOutlined />
        </IconButton>
        
        {/* Icône Profile avec style cohérent */}
        <IconButton onClick={handleProfileClick}>
          <PersonOutlined />
        </IconButton>
        
        {/* Menu Dropdown avec couleurs cohérentes */}
        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          PaperProps={{
            sx: {
              backgroundColor: colors.primary[400],
              minWidth: 220,
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
              border: `1px solid ${colors.grey[700]}`,
              borderRadius: '8px',
              mt: 1,
            }
          }}
        >
          {/* Info Personnel */}
          <MenuItem 
            onClick={handlePersonalInfo}
            sx={{
              padding: '12px 20px',
            }}
          >
            <AccountCircleOutlined 
              sx={{ 
                mr: 2, 
                fontSize: '20px'
              }} 
            />
            <Typography 
              fontSize="14px"
              fontWeight="500"
            >
              Info Personnel
            </Typography>
          </MenuItem>
          
          {/* Change Password */}
          <MenuItem 
            onClick={handleChangePassword}
            sx={{
              padding: '12px 20px',
            }}
          >
            <LockOutlined 
              sx={{ 
                mr: 2, 
                fontSize: '20px'
              }} 
            />
            <Typography 
              fontSize="14px"
              fontWeight="500"
            >
              Change Password
            </Typography>
          </MenuItem>
          
          {/* Paramètres */}
          <MenuItem 
            onClick={handleSettings}
            sx={{
              padding: '12px 20px',
            }}
          >
            <ManageAccountsOutlined 
              sx={{ 
                mr: 2, 
                fontSize: '20px'
              }} 
            />
            <Typography 
              fontSize="14px"
              fontWeight="500"
            >
              Paramètres
            </Typography>
          </MenuItem>
          
          {/* Divider */}
          <Divider sx={{ 
            backgroundColor: colors.grey[600],
            margin: '8px 16px'
          }} />
          
          {/* Logout */}
          <MenuItem 
            onClick={handleLogout}
            sx={{
              padding: '12px 20px',
            }}
          >
            <LogoutOutlined 
              sx={{ 
                mr: 2, 
                fontSize: '20px'
              }} 
            />
            <Typography 
              fontSize="14px"
              fontWeight="500"
            >
              Déconnexion
            </Typography>
          </MenuItem>
        </Menu>
      </Box>
    </Box>
  );
};

export default Topbar;