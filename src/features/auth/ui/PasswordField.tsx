import { IconButton, InputAdornment, TextField, type TextFieldProps } from '@mui/material'
import { useState } from 'react'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined'

export function PasswordField(props: TextFieldProps) {
  const [isSeen, setSeen] = useState(false)

  return (
    <TextField
      {...props}
      type={isSeen ? 'text' : 'password'}
      slotProps={{
        input: {
          endAdornment: (
            <InputAdornment position="end">
              {
                <IconButton
                  onClick={() => setSeen(!isSeen)}
                  aria-label={isSeen ? 'Скрыть пароль' : 'Показать пароль'}
                >
                  {isSeen ? <VisibilityOffOutlinedIcon /> : <VisibilityOutlinedIcon />}
                </IconButton>
              }
            </InputAdornment>
          ),
        },
      }}
    ></TextField>
  )
}
