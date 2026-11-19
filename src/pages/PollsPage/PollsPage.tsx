import AddIcon from '@mui/icons-material/Add'
import CheckIcon from '@mui/icons-material/Check'
import CloseIcon from '@mui/icons-material/Close'
import HowToVoteOutlinedIcon from '@mui/icons-material/HowToVoteOutlined'
import RefreshOutlinedIcon from '@mui/icons-material/Refresh'
import {
  Alert,
  Box,
  Button,
  ButtonBase,
  CircularProgress,
  IconButton,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { useParams } from 'react-router'
import {
  pollsApi,
  type CreatePollRequest,
  type Poll,
  type PollOptionResult,
} from '../../entities/polls'
import { useTripContext } from '../../entities/trip'
import { useSession } from '../../entities/user/model/sessionStore'
import { ApiError } from '../../shared/api'
import { EmojiAvatar } from '../../shared/ui'

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    if (error.status === 409) return 'Этот опрос уже закрыт. Голосовать в нём нельзя.'
    return error.message
  }
  return fallback
}

export function PollsPage() {
  const { tripId = '' } = useParams()
  const { trip, subscribe } = useTripContext()
  const currentUser = useSession((state) => state.user)
  const [polls, setPolls] = useState<Poll[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [busyPollId, setBusyPollId] = useState<string | null>(null)
  const [pageError, setPageError] = useState('')
  const [formError, setFormError] = useState('')
  const [snackbar, setSnackbar] = useState('')
  const [question, setQuestion] = useState('')
  const [options, setOptions] = useState(['Пятница, 18:00', 'Суббота, 7:00'])

  const loadPolls = useCallback(
    async (showLoader = true) => {
      if (showLoader) setLoading(true)
      setPageError('')
      try {
        const result = await pollsApi.getList(tripId)
        setPolls(result)
      } catch (error) {
        setPageError(getErrorMessage(error, 'Не удалось загрузить опросы. Попробуйте ещё раз.'))
      } finally {
        if (showLoader) setLoading(false)
      }
    },
    [tripId],
  )

  useEffect(() => {
    void loadPolls()
  }, [loadPolls])

  useEffect(
    () =>
      subscribe((event) => {
        if (event.entity === 'poll') void loadPolls(false)
      }),
    [loadPolls, subscribe],
  )

  function replacePoll(updated: Poll) {
    setPolls((current) => current.map((poll) => (poll.id === updated.id ? updated : poll)))
  }

  async function vote(poll: Poll, option: PollOptionResult) {
    if (busyPollId || poll.status !== 'open' || poll.my_option_id === option.id) return
    setBusyPollId(poll.id)
    setPageError('')
    try {
      const updated = await pollsApi.vote(tripId, poll.id, { option_id: option.id })
      replacePoll(updated)
      setSnackbar(poll.my_option_id ? 'Ваш голос изменён' : 'Ваш голос учтён')
    } catch (error) {
      setPageError(getErrorMessage(error, 'Не удалось сохранить голос. Попробуйте ещё раз.'))
    } finally {
      setBusyPollId(null)
    }
  }

  async function closePoll(poll: Poll) {
    if (busyPollId || poll.status !== 'open') return
    setBusyPollId(poll.id)
    setPageError('')
    try {
      const updated = await pollsApi.update(tripId, poll.id, { status: 'closed' })
      replacePoll(updated)
      setSnackbar('Голосование закрыто')
    } catch (error) {
      setPageError(getErrorMessage(error, 'Не удалось закрыть опрос.'))
    } finally {
      setBusyPollId(null)
    }
  }

  function changeOption(index: number, value: string) {
    setOptions((current) =>
      current.map((option, optionIndex) => (optionIndex === index ? value : option)),
    )
  }

  function addOption() {
    if (options.length < 6) setOptions((current) => [...current, ''])
  }

  function removeOption(index: number) {
    if (options.length <= 2) return
    setOptions((current) => current.filter((_, optionIndex) => optionIndex !== index))
  }

  async function createPoll(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const title = question.trim()
    const normalizedOptions = options.map((option) => option.trim()).filter(Boolean)
    if (!title) {
      setFormError('Введите вопрос для опроса.')
      return
    }
    if (normalizedOptions.length < 2) {
      setFormError('Добавьте хотя бы два непустых варианта.')
      return
    }
    if (
      new Set(normalizedOptions.map((option) => option.toLocaleLowerCase())).size !==
      normalizedOptions.length
    ) {
      setFormError('Варианты ответа не должны повторяться.')
      return
    }

    const payload: CreatePollRequest = {
      title,
      options: normalizedOptions.map((option) => ({ title: option })),
    }
    setCreating(true)
    setFormError('')
    setPageError('')
    try {
      const created = await pollsApi.create(tripId, payload)
      setPolls((current) => [created, ...current])
      setQuestion('')
      setOptions(['', ''])
      setSnackbar('Опрос создан')
    } catch (error) {
      setFormError(getErrorMessage(error, 'Не удалось создать опрос. Попробуйте ещё раз.'))
    } finally {
      setCreating(false)
    }
  }

  return (
    <Box sx={{ maxWidth: 1200, width: '100%', mx: 'auto', pb: 5 }}>
      {pageError && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => void loadPolls()}
              startIcon={<RefreshOutlinedIcon />}
            >
              Повторить
            </Button>
          }
        >
          {pageError}
        </Alert>
      )}

      {loading ? (
        <Box
          sx={{ minHeight: 320, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <CircularProgress aria-label="Загрузка опросов" />
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, alignItems: 'flex-start' }}>
          <Stack spacing={2.5} sx={{ flex: '999 1 560px', minWidth: 0 }}>
            {polls.length === 0 ? (
              <Paper variant="outlined" sx={{ p: 4, borderRadius: '20px', textAlign: 'center' }}>
                <HowToVoteOutlinedIcon sx={{ fontSize: 38, color: 'text.secondary', mb: 1 }} />
                <Typography sx={{ fontWeight: 700, mb: 0.5 }}>Пока нет опросов</Typography>
                <Typography color="text.secondary" variant="body2">
                  Создайте первый опрос, чтобы вместе решить, как провести поездку.
                </Typography>
              </Paper>
            ) : (
              polls.map((poll) => (
                <PollCard
                  key={poll.id}
                  poll={poll}
                  canManage={
                    poll.created_by.user_id === currentUser?.id || trip.my_role === 'organizer'
                  }
                  busy={busyPollId === poll.id}
                  onVote={(option) => void vote(poll, option)}
                  onClose={() => void closePoll(poll)}
                />
              ))
            )}
          </Stack>

          <Paper
            component="form"
            onSubmit={createPoll}
            variant="outlined"
            sx={{
              flex: '1 1 340px',
              minWidth: 0,
              p: 2.75,
              borderRadius: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              bgcolor: '#FFFFFF',
            }}
          >
            <Typography
              component="h2"
              sx={{ fontFamily: "'Unbounded', sans-serif", fontSize: 18, fontWeight: 600 }}
            >
              Новый опрос
            </Typography>
            <Stack spacing={1}>
              <Typography
                component="label"
                htmlFor="poll-question"
                sx={{ fontSize: 14, fontWeight: 700 }}
              >
                Вопрос
              </Typography>
              <TextField
                id="poll-question"
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder="Например, когда выезжаем?"
                inputProps={{ maxLength: 120, 'aria-label': 'Вопрос опроса' }}
                size="small"
                sx={{ '& .MuiOutlinedInput-root': { height: 48, borderRadius: '12px' } }}
              />
            </Stack>

            <Stack component="fieldset" spacing={1} sx={{ p: 0, m: 0, border: 0, minWidth: 0 }}>
              <Typography component="legend" sx={{ fontSize: 14, fontWeight: 700, mb: 0.5 }}>
                Варианты
              </Typography>
              {options.map((option, index) => (
                <Stack key={index} direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  <TextField
                    fullWidth
                    value={option}
                    onChange={(event) => changeOption(index, event.target.value)}
                    placeholder={`Вариант ${index + 1}`}
                    inputProps={{ maxLength: 100, 'aria-label': `Вариант ${index + 1}` }}
                    size="small"
                    sx={{
                      minWidth: 0,
                      '& .MuiOutlinedInput-root': { height: 44, borderRadius: '12px' },
                    }}
                  />
                  <IconButton
                    aria-label={`Убрать вариант ${index + 1}`}
                    onClick={() => removeOption(index)}
                    disabled={options.length <= 2}
                    sx={{ width: 44, height: 44, flex: 'none', color: 'text.secondary' }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Stack>
              ))}
              <Button
                type="button"
                variant="outlined"
                onClick={addOption}
                disabled={options.length >= 6}
                startIcon={<AddIcon />}
                sx={{
                  justifyContent: 'flex-start',
                  height: 44,
                  borderStyle: 'dashed',
                  borderColor: '#9FD4D8',
                  bgcolor: '#F1FAFA',
                  color: '#0A5E66',
                  borderRadius: '12px',
                  '&:hover': { borderStyle: 'dashed', bgcolor: '#E5F5F5' },
                }}
              >
                Добавить вариант
              </Button>
            </Stack>

            {formError && <Alert severity="error">{formError}</Alert>}
            <Button
              type="submit"
              variant="contained"
              disabled={
                creating || !question.trim() || options.filter((option) => option.trim()).length < 2
              }
              sx={{ height: 48, borderRadius: '14px', fontWeight: 700 }}
            >
              {creating ? 'Создаём…' : 'Создать опрос'}
            </Button>
          </Paper>
        </Box>
      )}

      <Snackbar
        open={Boolean(snackbar)}
        autoHideDuration={3000}
        onClose={() => setSnackbar('')}
        message={snackbar}
      />
    </Box>
  )
}

function PollCard({
  poll,
  canManage,
  busy,
  onVote,
  onClose,
}: {
  poll: Poll
  canManage: boolean
  busy: boolean
  onVote: (option: PollOptionResult) => void
  onClose: () => void
}) {
  const isOpen = poll.status === 'open'
  const votedCount = poll.total_votes
  const winnerId = poll.options.reduce<PollOptionResult | null>(
    (winner, option) => (!winner || option.votes_count > winner.votes_count ? option : winner),
    null,
  )?.id

  return (
    <Paper
      component="article"
      variant="outlined"
      sx={{
        p: { xs: 2, sm: 3 },
        borderRadius: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 2.25,
        bgcolor: '#FFFFFF',
      }}
    >
      <Stack
        direction="row"
        sx={{ alignItems: 'flex-start', justifyContent: 'space-between', gap: 1.5 }}
      >
        <Box sx={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
          <Typography
            component="h2"
            sx={{
              m: 0,
              fontFamily: "'Unbounded', sans-serif",
              fontWeight: 600,
              fontSize: 19,
              overflowWrap: 'anywhere',
            }}
          >
            {poll.title}
          </Typography>
          <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
            <EmojiAvatar
              emoji={poll.created_by.avatar_emoji}
              size="sm"
              label={poll.created_by.nickname}
            />
            <Typography sx={{ fontSize: 14, color: '#5B6576' }}>
              Создал {poll.created_by.nickname} · проголосовали {votedCount} из {poll.total_members}
            </Typography>
          </Stack>
        </Box>
        <Box
          sx={{
            height: 28,
            px: 1.5,
            flex: 'none',
            borderRadius: '14px',
            bgcolor: isOpen ? '#DDF1F2' : '#EEF1F5',
            color: isOpen ? '#0A5E66' : '#3D4757',
            fontSize: 13,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {isOpen ? 'Идёт голосование' : 'Закрыт'}
        </Box>
      </Stack>

      <Stack
        role={isOpen ? 'radiogroup' : undefined}
        aria-label={isOpen ? 'Варианты ответа' : undefined}
        spacing={1.25}
      >
        {poll.options.map((option) => (
          <PollOptionRow
            key={option.id}
            option={option}
            totalVotes={poll.total_votes}
            selected={poll.my_option_id === option.id}
            isOpen={isOpen}
            winner={winnerId === option.id && !isOpen && poll.total_votes > 0}
            onClick={() => onVote(option)}
            disabled={busy}
          />
        ))}
      </Stack>

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        sx={{
          alignItems: { xs: 'stretch', sm: 'center' },
          justifyContent: 'space-between',
          gap: 1.5,
          pt: 0.5,
        }}
      >
        <Typography sx={{ fontSize: 14, color: '#5B6576' }}>
          {isOpen
            ? poll.my_option_id
              ? 'Можно поменять голос, пока опрос открыт'
              : 'Выберите вариант, чтобы проголосовать'
            : 'Голосование завершено'}
        </Typography>
        {isOpen && canManage && (
          <Button
            variant="outlined"
            color="inherit"
            onClick={onClose}
            disabled={busy}
            sx={{
              height: 40,
              px: 2,
              borderRadius: '12px',
              borderColor: '#C9D3DF',
              color: '#1B2433',
              flex: 'none',
            }}
          >
            Закрыть опрос
          </Button>
        )}
      </Stack>
    </Paper>
  )
}

function PollOptionRow({
  option,
  totalVotes,
  selected,
  isOpen,
  winner,
  onClick,
  disabled,
}: {
  option: PollOptionResult
  totalVotes: number
  selected: boolean
  isOpen: boolean
  winner: boolean
  onClick: () => void
  disabled: boolean
}) {
  const percentage = totalVotes ? Math.round((option.votes_count / totalVotes) * 100) : 0
  const fill = selected ? '#DDF1F2' : '#FDEBDB'

  return (
    <ButtonBase
      component="button"
      type="button"
      role={isOpen ? 'radio' : undefined}
      aria-checked={isOpen ? selected : undefined}
      aria-label={`${option.title}, ${option.votes_count} голосов, ${percentage}%`}
      disabled={isOpen && disabled}
      onClick={onClick}
      sx={{
        position: 'relative',
        overflow: 'hidden',
        width: '100%',
        minHeight: isOpen ? 64 : 52,
        display: 'flex',
        alignItems: 'center',
        gap: 1.75,
        px: 2,
        py: 1.5,
        borderRadius: '14px',
        border: selected ? '2px solid #0E7C86' : '1px solid #E3E8EF',
        bgcolor: winner ? '#FDEBDB' : '#FFFFFF',
        color: '#1B2433',
        textAlign: 'left',
        justifyContent: 'flex-start',
        opacity: disabled ? 0.7 : 1,
        cursor: isOpen ? 'pointer' : 'default',
        '&:hover': isOpen ? { borderColor: '#0E7C86', bgcolor: '#FAFDFD' } : {},
      }}
    >
      {isOpen && (
        <Box
          aria-hidden="true"
          sx={{
            position: 'absolute',
            inset: '0 auto 0 0',
            width: `${percentage}%`,
            bgcolor: fill,
            pointerEvents: 'none',
          }}
        />
      )}
      {winner && (
        <Typography aria-hidden="true" sx={{ position: 'relative', fontSize: 20 }}>
          🏆
        </Typography>
      )}
      {isOpen && (
        <Box
          aria-hidden="true"
          sx={{
            position: 'relative',
            width: 24,
            height: 24,
            flex: 'none',
            borderRadius: '50%',
            border: selected ? 0 : '2px solid #C9D3DF',
            bgcolor: selected ? '#0E7C86' : '#FFFFFF',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {selected && <CheckIcon sx={{ fontSize: 16 }} />}
        </Box>
      )}
      <Box
        sx={{
          position: 'relative',
          flex: '1 1 auto',
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 0.25,
        }}
      >
        <Typography
          sx={{
            fontSize: 16,
            fontWeight: selected || winner ? 700 : 600,
            overflowWrap: 'anywhere',
          }}
        >
          {option.title}
        </Typography>
        {isOpen && option.description && (
          <Typography sx={{ fontSize: 13, color: '#3D4757', overflowWrap: 'anywhere' }}>
            {option.description}
          </Typography>
        )}
        {selected && isOpen && (
          <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#0A5E66' }}>
            Ваш голос
          </Typography>
        )}
      </Box>
      <Stack
        direction="row"
        spacing={1}
        sx={{ position: 'relative', flex: 'none', alignItems: 'center' }}
      >
        <Stack direction="row" sx={{ alignItems: 'center', '& > * + *': { ml: '-8px' } }}>
          {option.voters.slice(0, 3).map((voter) => (
            <Box
              key={voter.user_id}
              sx={{
                border: '2px solid #FFFFFF',
                borderRadius: '50%',
                width: 28,
                height: 28,
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: '#FFFFFF',
              }}
            >
              <Box
                component="span"
                role="img"
                aria-label={voter.nickname}
                sx={{ fontSize: 14, lineHeight: 1 }}
              >
                {voter.avatar_emoji}
              </Box>
            </Box>
          ))}
        </Stack>
        <Typography
          sx={{
            minWidth: 42,
            textAlign: 'right',
            fontSize: 15,
            fontWeight: 700,
            whiteSpace: 'nowrap',
          }}
        >
          {isOpen
            ? `${percentage}%`
            : `${option.votes_count} ${pluralVotes(option.votes_count)} · ${percentage}%`}
        </Typography>
      </Stack>
    </ButtonBase>
  )
}

function pluralVotes(count: number) {
  const mod10 = count % 10
  const mod100 = count % 100
  if (mod10 === 1 && mod100 !== 11) return 'голос'
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'голоса'
  return 'голосов'
}
