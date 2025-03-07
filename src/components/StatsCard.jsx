// src/components/StatsCard.jsx
import React from "react";
import PropTypes from "prop-types";
import { Card, CardContent, Typography } from '@mui/material';
import { green, orange, blue } from '@mui/material/colors'; // Ajoutez blue

export const StatsCard = ({ title, value, color = 'blue' }) => { // Changez primary par blue
  const cardColor = color === 'success' ? green[500] : color === 'warning' ? orange[500] : color === 'primary' ? blue[500] : null;

  return (
    <Card style={{ backgroundColor: cardColor, color: '#FFFFFF' }}> {/* Texte blanc pour contraste */}
      <CardContent>
        <Typography variant="h6" className="text-white font-bold">
          {title}
        </Typography>
        <Typography variant="h5" className="text-white font-bold mt-2">
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
};

StatsCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  color: PropTypes.string,
};