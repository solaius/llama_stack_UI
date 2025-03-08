import React, { useState, ReactNode } from 'react';
import { 
  AppBar, 
  Box, 
  CssBaseline, 
  Divider, 
  Drawer, 
  IconButton, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText, 
  Toolbar, 
  Typography, 
  useMediaQuery, 
  useTheme as useMuiTheme,
  Stack
} from '@mui/material';
import {
  Menu as MenuIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  Chat as ChatIcon,
  Code as CodeIcon,
  Settings as SettingsIcon,
  Home as HomeIcon,
  Assessment as AssessmentIcon,
  Storage as StorageIcon,
  SmartToy as AgentIcon
} from '@mui/icons-material';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import RHLSLogo from '../../images/RHLS.svg';

const drawerWidth = 240;

interface LayoutProps {
  children: ReactNode;
}

interface NavItem {
  text: string;
  path: string;
  icon: ReactNode;
}

const navItems: NavItem[] = [
  { text: 'Home', path: '/', icon: <HomeIcon /> },
  { text: 'Chat', path: '/chat', icon: <ChatIcon /> },
  { text: 'Tools', path: '/tools', icon: <CodeIcon /> },
  { text: 'Models', path: '/models', icon: <StorageIcon /> },
  { text: 'Agents', path: '/agents', icon: <AgentIcon /> },
  { text: 'Evaluations', path: '/evaluations', icon: <AssessmentIcon /> },
  { text: 'Settings', path: '/settings', icon: <SettingsIcon /> },
];

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { mode, toggleColorMode } = useTheme();
  const muiTheme = useMuiTheme();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const drawer = (
    <div>
      <Toolbar>
        <Stack direction="row" spacing={1} alignItems="center">
          <img src={RHLSLogo} alt="RHLS Logo" style={{ height: '30px', width: 'auto' }} />
          <Typography variant="h6" noWrap component="div">
            Llama Stack UI
          </Typography>
        </Stack>
      </Toolbar>
      <Divider />
      <List>
        {navItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton 
              component={Link} 
              to={item.path}
              selected={location.pathname === item.path}
            >
              <ListItemIcon>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
            <img src={RHLSLogo} alt="RHLS Logo" style={{ height: '30px', width: 'auto' }} />
            <Typography variant="h6" noWrap component="div">
              {navItems.find(item => item.path === location.pathname)?.text || 'Llama Stack UI'}
            </Typography>
          </Stack>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }}>
            {navItems.find(item => item.path === location.pathname)?.text || 'Llama Stack UI'}
          </Typography>
          <IconButton color="inherit" onClick={toggleColorMode}>
            {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
          </IconButton>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
};

export default Layout;