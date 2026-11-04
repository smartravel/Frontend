import { zodResolver } from '@hookform/resolvers/zod'
import { Alert, Box, Button, Stack, TextField, Typography } from '@mui/material'
import { useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { authApi, useSession, type User } from '../../../entities/user'
import { ApiError } from '../../../shared/api'
import { EmojiAvatar } from '../../../shared/ui'
import { profileSchema, type ProfileFormValues } from '../model/shema'
import { EmojiPicker } from './EmojiPicker'

export function ProfileForm({ user }: { user: User }) {
  const setUser = useSession((state) => state.setUser)
  const [saved, setSaved] = useState(false)

  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { nickname: user.nickname, avatar_emoji: user.avatar_emoji },
  })

  const avatar = useWatch({ control, name: 'avatar_emoji' })

  async function onSubmit(values: ProfileFormValues) {
    setSaved(false)
    try {
      const updated = await authApi.updateMe(values)
      setUser(updated)
      reset({ nickname: updated.nickname, avatar_emoji: updated.avatar_emoji })
      setSaved(true)
    } catch (e) {
      setError('root', { message: e instanceof ApiError ? e.message : 'Неизвестная ошибка' })
    }
  }

  return (
    <Stack component="form" noValidate onSubmit={handleSubmit(onSubmit)} spacing={3}>
      {errors.root && <Alert severity="error">{errors.root.message}</Alert>}

      <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
        <EmojiAvatar emoji={avatar} size="lg" label={`Ваш аватар: ${avatar}`} />
        <Box>
          <Typography sx={{ fontWeight: 700 }}>{user.email}</Typography>
          <Typography variant="body2" color="text.secondary">
            Так вас видят друзья в поездках
          </Typography>
        </Box>
      </Stack>

      <Controller
        name="nickname"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label="Никнейм"
            autoComplete="nickname"
            error={!!errors.nickname}
            helperText={errors.nickname?.message}
          />
        )}
      />

      <Stack spacing={1.5}>
        <Typography sx={{ fontWeight: 700 }}>Аватарка</Typography>
        <Controller
          name="avatar_emoji"
          control={control}
          render={({ field }) => <EmojiPicker value={field.value} onChange={field.onChange} />}
        />
      </Stack>

      <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
        <Button type="submit" variant="contained" loading={isSubmitting} disabled={!isDirty}>
          Сохранить
        </Button>
        {saved && !isDirty && (
          <Typography role="status" color="primary.dark" sx={{ fontWeight: 600 }}>
            Изменения сохранены
          </Typography>
        )}
      </Stack>
    </Stack>
  )
}
