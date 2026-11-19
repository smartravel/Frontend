import AddIcon from '@mui/icons-material/Add'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import RefreshOutlinedIcon from '@mui/icons-material/Refresh'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  LinearProgress,
  Paper,
  Snackbar,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import { useCallback, useEffect, useMemo, useState, type FormEvent, type MouseEvent } from 'react'
import { useParams } from 'react-router'
import {
  checklistApi,
  type ChecklistItem,
  type ChecklistScope,
  type CreateChecklistRequest,
  type UpdateChecklistRequest,
} from '../../entities/checklist'
import { useTripContext, type Member } from '../../entities/trip'
import { useSession } from '../../entities/user/model/sessionStore'
import { ChecklistItemRow } from '../../features/checklist'
import { ApiError } from '../../shared/api'
import { EmojiAvatar } from '../../shared/ui'

function errorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback
}

type ScopeLists = Record<ChecklistScope, ChecklistItem[]>

export function ChecklistPage() {
  const { tripId = '' } = useParams()
  const { members } = useTripContext()
  const currentUser = useSession((state) => state.user)
  const [scope, setScope] = useState<ChecklistScope>('shared')
  const [lists, setLists] = useState<ScopeLists>({ shared: [], personal: [] })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [newTitle, setNewTitle] = useState('')
  const [error, setError] = useState('')
  const [snackbar, setSnackbar] = useState('')
  const [showAllChecked, setShowAllChecked] = useState(false)
  const [editingItem, setEditingItem] = useState<ChecklistItem | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [deletingItem, setDeletingItem] = useState<ChecklistItem | null>(null)

  const loadLists = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [shared, personal] = await Promise.all([
        checklistApi.getList(tripId, 'shared'),
        checklistApi.getList(tripId, 'personal'),
      ])
      setLists({ shared, personal })
    } catch (loadError) {
      setError(errorMessage(loadError, 'Не удалось загрузить чеклист. Попробуйте ещё раз.'))
    } finally {
      setLoading(false)
    }
  }, [tripId])

  useEffect(() => {
    void loadLists()
  }, [loadLists])

  const currentItems = lists[scope]
  const pendingItems = useMemo(
    () => currentItems.filter((item) => !item.is_checked),
    [currentItems],
  )
  const checkedItems = useMemo(() => currentItems.filter((item) => item.is_checked), [currentItems])
  const visibleCheckedItems = showAllChecked ? checkedItems : checkedItems.slice(0, 2)
  const completedCount = currentItems.filter((item) => item.is_checked).length
  const progress = currentItems.length ? (completedCount / currentItems.length) * 100 : 0

  function replaceItem(updated: ChecklistItem) {
    setLists((current) => ({
      ...current,
      [updated.scope]: current[updated.scope].map((item) =>
        item.id === updated.id ? updated : item,
      ),
    }))
  }

  async function createItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const title = newTitle.trim()
    if (!title || saving) return
    setSaving(true)
    setError('')
    try {
      const payload: CreateChecklistRequest = { title, scope }
      const created = await checklistApi.create(tripId, payload)
      setLists((current) => ({ ...current, [scope]: [...current[scope], created] }))
      setNewTitle('')
      setShowAllChecked(false)
      setSnackbar('Пункт добавлен в чеклист')
    } catch (createError) {
      setError(errorMessage(createError, 'Не удалось добавить пункт. Попробуйте ещё раз.'))
    } finally {
      setSaving(false)
    }
  }

  async function updateItem(
    item: ChecklistItem,
    patch: UpdateChecklistRequest,
    successMessage?: string,
  ): Promise<boolean> {
    if (busyId) return false
    setBusyId(item.id)
    setError('')
    try {
      const updated = await checklistApi.update(tripId, item.id, patch)
      replaceItem(updated)
      if (successMessage) setSnackbar(successMessage)
      return true
    } catch (updateError) {
      setError(errorMessage(updateError, 'Не удалось обновить пункт. Попробуйте ещё раз.'))
      return false
    } finally {
      setBusyId(null)
    }
  }

  function openEdit(item: ChecklistItem) {
    setEditingItem(item)
    setEditingTitle(item.title)
  }

  async function saveEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editingItem || !editingTitle.trim()) return
    const item = editingItem
    const saved = await updateItem(item, { title: editingTitle.trim() }, 'Название изменено')
    if (saved) setEditingItem(null)
  }

  async function confirmDelete() {
    if (!deletingItem) return
    const item = deletingItem
    setBusyId(item.id)
    setError('')
    try {
      await checklistApi.delete(tripId, item.id)
      setLists((current) => ({
        ...current,
        [item.scope]: current[item.scope].filter((entry) => entry.id !== item.id),
      }))
      setSnackbar('Пункт удалён')
      setDeletingItem(null)
    } catch (deleteError) {
      setError(errorMessage(deleteError, 'Не удалось удалить пункт. Попробуйте ещё раз.'))
    } finally {
      setBusyId(null)
    }
  }

  function changeScope(_event: MouseEvent<HTMLElement>, nextScope: ChecklistScope | null) {
    if (nextScope) {
      setScope(nextScope)
      setShowAllChecked(false)
      setNewTitle('')
      setError('')
    }
  }

  const sharedStats = useMemo(() => getMemberStats(lists.shared, members), [lists.shared, members])

  return (
    <Box sx={{ maxWidth: 1200, width: '100%', mx: 'auto', pb: 5 }}>
      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => void loadLists()}
              startIcon={<RefreshOutlinedIcon />}
            >
              Повторить
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {loading ? (
        <Box
          sx={{ minHeight: 320, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <CircularProgress aria-label="Загрузка чеклиста" />
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, alignItems: 'flex-start' }}>
          <Stack spacing={2.5} sx={{ flex: '999 1 560px', minWidth: 0 }}>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              sx={{
                alignItems: { xs: 'stretch', sm: 'center' },
                justifyContent: 'space-between',
                gap: 2,
              }}
            >
              <ToggleButtonGroup
                exclusive
                value={scope}
                onChange={changeScope}
                aria-label="Тип чеклиста"
                sx={{
                  p: 0.5,
                  bgcolor: '#E9EEF3',
                  borderRadius: '14px',
                  alignSelf: 'flex-start',
                  '& .MuiToggleButton-root': {
                    border: 0,
                    borderRadius: '10px !important',
                    px: 2.25,
                    height: 40,
                    color: '#3D4757',
                    fontSize: 15,
                    fontWeight: 600,
                    textTransform: 'none',
                  },
                  '& .Mui-selected': {
                    bgcolor: '#FFFFFF !important',
                    color: '#1B2433 !important',
                    fontWeight: 700,
                    boxShadow: '0 1px 3px rgba(27,36,51,0.12)',
                  },
                }}
              >
                <ToggleButton value="shared">Общий · {lists.shared.length}</ToggleButton>
                <ToggleButton value="personal">Личный · {lists.personal.length}</ToggleButton>
              </ToggleButtonGroup>

              <Stack
                direction="row"
                spacing={1.5}
                sx={{ alignItems: 'center', minWidth: { sm: 240 }, flex: '0 1 320px' }}
              >
                <Typography sx={{ fontSize: 14, fontWeight: 700, whiteSpace: 'nowrap' }}>
                  Собрано {completedCount} из {currentItems.length}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={progress}
                  aria-label={`Собрано ${Math.round(progress)} процентов`}
                  sx={{
                    flex: 1,
                    height: 10,
                    borderRadius: 5,
                    bgcolor: '#E3E8EF',
                    '& .MuiLinearProgress-bar': { borderRadius: 5 },
                  }}
                />
              </Stack>
            </Stack>

            <Box component="form" onSubmit={createItem} sx={{ display: 'flex', gap: 1.5 }}>
              <TextField
                fullWidth
                value={newTitle}
                onChange={(event) => setNewTitle(event.target.value)}
                placeholder="Добавить вещь или задачу…"
                inputProps={{ 'aria-label': 'Новая вещь или задача', maxLength: 120 }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    height: 52,
                    borderRadius: '14px',
                    bgcolor: '#FFFFFF',
                  },
                }}
              />
              <Button
                type="submit"
                variant="contained"
                startIcon={<AddIcon />}
                disabled={!newTitle.trim() || saving}
                sx={{ height: 52, flex: 'none', px: 2.75 }}
              >
                Добавить
              </Button>
            </Box>

            <Paper variant="outlined" sx={{ borderRadius: '20px', overflow: 'hidden' }}>
              <Typography
                component="h2"
                sx={{
                  px: 2.75,
                  pt: 2.25,
                  pb: 1.25,
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: 'text.secondary',
                }}
              >
                Нужно взять · {pendingItems.length}
              </Typography>
              {pendingItems.length ? (
                pendingItems.map((item) => (
                  <ChecklistItemRow
                    key={item.id}
                    item={item}
                    members={members}
                    personal={scope === 'personal'}
                    currentUserId={currentUser?.id}
                    disabled={busyId === item.id}
                    onToggle={(entry, checked) =>
                      void updateItem(
                        entry,
                        { is_checked: checked },
                        checked ? 'Отмечено как взято' : 'Отметка снята',
                      )
                    }
                    onAssign={(entry, assigneeId) =>
                      void updateItem(entry, { assignee_id: assigneeId }, 'Ответственный обновлён')
                    }
                    onEdit={openEdit}
                    onDelete={setDeletingItem}
                  />
                ))
              ) : (
                <Box sx={{ px: 2.75, py: 3, borderTop: '1px solid #EEF1F5', textAlign: 'center' }}>
                  <Typography color="text.secondary" variant="body2">
                    Все пункты уже отмечены. Отличная работа!
                  </Typography>
                </Box>
              )}

              <Divider />
              <Typography
                component="h2"
                sx={{
                  px: 2.75,
                  pt: 2.25,
                  pb: 1.25,
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: 'text.secondary',
                }}
              >
                Уже взяли · {checkedItems.length}
              </Typography>
              {visibleCheckedItems.length ? (
                visibleCheckedItems.map((item) => (
                  <ChecklistItemRow
                    key={item.id}
                    item={item}
                    members={members}
                    personal={scope === 'personal'}
                    currentUserId={currentUser?.id}
                    disabled={busyId === item.id}
                    onToggle={(entry, checked) =>
                      void updateItem(
                        entry,
                        { is_checked: checked },
                        checked ? 'Отмечено как взято' : 'Пункт возвращён в список',
                      )
                    }
                    onAssign={(entry, assigneeId) =>
                      void updateItem(entry, { assignee_id: assigneeId }, 'Ответственный обновлён')
                    }
                    onEdit={openEdit}
                    onDelete={setDeletingItem}
                  />
                ))
              ) : (
                <Box sx={{ px: 2.75, py: 2, borderTop: '1px solid #EEF1F5' }}>
                  <Typography color="text.secondary" variant="body2">
                    Здесь появятся отмеченные пункты.
                  </Typography>
                </Box>
              )}
              {checkedItems.length > 2 && (
                <Button
                  fullWidth
                  onClick={() => setShowAllChecked((value) => !value)}
                  sx={{
                    height: 52,
                    borderTop: '1px solid #EEF1F5',
                    borderRadius: 0,
                    color: 'primary.dark',
                  }}
                >
                  {showAllChecked ? 'Скрыть' : `Показать ещё ${checkedItems.length - 2}`}
                </Button>
              )}
            </Paper>
          </Stack>

          <Stack
            component="aside"
            aria-label="Кто что берёт"
            spacing={2.5}
            sx={{ flex: '1 1 320px', minWidth: 0 }}
          >
            <Paper variant="outlined" sx={{ p: 2.75, borderRadius: '20px' }}>
              <Typography
                component="h2"
                sx={{ mb: 2, fontFamily: "'Unbounded', sans-serif", fontSize: 18, fontWeight: 600 }}
              >
                Кто что берёт
              </Typography>
              <Stack spacing={1.75}>
                {sharedStats.members.map(({ member, total, checked }) => (
                  <Stack
                    key={member.user_id}
                    direction="row"
                    spacing={1.5}
                    sx={{ alignItems: 'center' }}
                  >
                    <EmojiAvatar emoji={member.avatar_emoji} size="md" label={member.nickname} />
                    <Typography sx={{ flex: 1, fontSize: 15, fontWeight: 600 }}>
                      {member.user_id === currentUser?.id ? member.nickname : member.nickname}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: 14,
                        color: total > 0 && checked === total ? 'primary.dark' : 'text.secondary',
                        fontWeight: checked === total && total > 0 ? 700 : 400,
                      }}
                    >
                      {checked} из {total}
                      {checked === total && total > 0 ? ' ✓' : ''}
                    </Typography>
                  </Stack>
                ))}
                <Divider />
                <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      flex: 'none',
                      borderRadius: '50%',
                      border: '1px dashed #C9D3DF',
                    }}
                  />
                  <Typography sx={{ flex: 1, fontSize: 15, fontWeight: 600, color: '#8A4A12' }}>
                    Без ответственного
                  </Typography>
                  <Typography sx={{ fontSize: 14, fontWeight: 700, color: '#8A4A12' }}>
                    {sharedStats.unassigned}
                  </Typography>
                </Stack>
              </Stack>
            </Paper>

            <Box
              sx={{
                p: 2.25,
                borderRadius: '20px',
                bgcolor: '#DDF1F2',
                color: '#0A4F56',
                display: 'flex',
                gap: 1.5,
              }}
            >
              <LockOutlinedIcon sx={{ flex: 'none' }} />
              <Typography sx={{ fontSize: 14, lineHeight: 1.45 }}>
                Личный список видите только вы — туда удобно добавить зарядку, документы и
                лекарства.
              </Typography>
            </Box>
          </Stack>
        </Box>
      )}

      <Dialog
        open={Boolean(editingItem)}
        onClose={() => setEditingItem(null)}
        fullWidth
        maxWidth="xs"
      >
        <Box component="form" onSubmit={saveEdit}>
          <DialogTitle sx={{ fontFamily: "'Unbounded', sans-serif", fontSize: 18 }}>
            Изменить пункт
          </DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              fullWidth
              label="Название"
              value={editingTitle}
              onChange={(event) => setEditingTitle(event.target.value)}
              inputProps={{ maxLength: 120 }}
              sx={{ mt: 1 }}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2.5, pt: 1 }}>
            <Button color="inherit" onClick={() => setEditingItem(null)}>
              Отмена
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={!editingTitle.trim() || Boolean(busyId)}
            >
              Сохранить
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Dialog
        open={Boolean(deletingItem)}
        onClose={() => setDeletingItem(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontFamily: "'Unbounded', sans-serif", fontSize: 18 }}>
          Удалить пункт?
        </DialogTitle>
        <DialogContent>
          <Typography color="text.secondary">
            Пункт «{deletingItem?.title}» будет удалён из чеклиста.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button color="inherit" onClick={() => setDeletingItem(null)}>
            Отмена
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => void confirmDelete()}
            disabled={Boolean(busyId)}
          >
            Удалить
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={Boolean(snackbar)}
        autoHideDuration={3000}
        onClose={() => setSnackbar('')}
        message={snackbar}
      />
    </Box>
  )
}

function getMemberStats(items: ChecklistItem[], members: Member[]) {
  const stats = members.map((member) => {
    const assigned = items.filter((item) => item.assignee_id === member.user_id)
    return {
      member,
      total: assigned.length,
      checked: assigned.filter((item) => item.is_checked).length,
    }
  })
  return {
    members: stats,
    unassigned: items.filter((item) => !item.assignee_id).length,
  }
}
