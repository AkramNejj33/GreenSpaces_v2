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
  
  const { logout, user, tokenService } = useAuth();
  
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
    // navigate('/profile');
  };

  const handleChangePassword = () => {
    handleClose();
    console.log("Naviguer vers Change Password");
    navigate('/change-password');
  };

  const handleSettings = () => {
    handleClose();
    console.log("Naviguer vers Paramètres");
    // navigate('/settings');
  };

  const handleLogout = async () => {
    handleClose();
    
    console.log('=== DÉBUT DÉCONNEXION ===');
    console.log('Utilisateur:', user?.email);
    
    try {
      await logout();
      
      console.log('✅ Déconnexion complète réussie');
      
      navigate('/login', { 
        replace: true,
        state: { 
          message: 'You have been logged out successfully.' 
        }
      });
      
    } catch (error) {
      console.error('❌ Erreur lors de la déconnexion:', error);
      
      navigate('/login', { 
        replace: true,
        state: { 
          message: 'Session ended. Please log in again.' 
        }
      });
    }
    
    console.log('=== FIN DÉCONNEXION ===');
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
      <Box display="flex" alignItems="center">
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
        
        {/* Icône Profile avec style cohérent comme les autres */}
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
          {/* Header avec info utilisateur */}
          {user && (
            <Box sx={{ px: 3, py: 2, borderBottom: `1px solid ${colors.grey[600]}` }}>
              <Typography 
                variant="body2" 
                color={colors.grey[100]}
                fontWeight="600"
              >
                {user.name}
              </Typography>
              <Typography 
                variant="caption" 
                color={colors.grey[300]}
              >
                {user.email}
              </Typography>
            </Box>
          )}
          
          {/* Info Personnel */}
          <MenuItem 
            onClick={handlePersonalInfo}
            sx={{
              padding: '12px 20px',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
              }
            }}
          >
            <AccountCircleOutlined 
              sx={{ 
                mr: 2, 
                fontSize: '20px',
                color: colors.grey[100]
              }} 
            />
            <Typography 
              fontSize="14px"
              fontWeight="500"
              color={colors.grey[100]}
            >
              Info Personnel
            </Typography>
          </MenuItem>
          
          {/* Change Password */}
          <MenuItem 
            onClick={handleChangePassword}
            sx={{
              padding: '12px 20px',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
              }
            }}
          >
            <LockOutlined 
              sx={{ 
                mr: 2, 
                fontSize: '20px',
                color: colors.grey[100]
              }} 
            />
            <Typography 
              fontSize="14px"
              fontWeight="500"
              color={colors.grey[100]}
            >
              Change Password
            </Typography>
          </MenuItem>
          
          {/* Paramètres */}
          <MenuItem 
            onClick={handleSettings}
            sx={{
              padding: '12px 20px',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
              }
            }}
          >
            <ManageAccountsOutlined 
              sx={{ 
                mr: 2, 
                fontSize: '20px',
                color: colors.grey[100]
              }} 
            />
            <Typography 
              fontSize="14px"
              fontWeight="500"
              color={colors.grey[100]}
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
              '&:hover': {
                backgroundColor: colors.redAccent[800],
              }
            }}
          >
            <LogoutOutlined 
              sx={{ 
                mr: 2, 
                fontSize: '20px',
                color: colors.redAccent[500]
              }} 
            />
            <Typography 
              fontSize="14px"
              fontWeight="500"
              color={colors.grey[100]}
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