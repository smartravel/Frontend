export type PollStatus = 'open' | 'closed'

export type PollAuthor = {
  user_id: string
  nickname: string
  avatar_emoji: string
}

export type PollVoter = PollAuthor

export type PollOptionInput = {
  title: string
  description?: string
}

export type PollOptionResult = {
  id: string
  title: string
  description: string | null
  votes_count: number
  voters: PollVoter[]
}

export type Poll = {
  id: string
  title: string
  status: PollStatus
  created_by: PollAuthor
  created_at: string
  total_votes: number
  total_members: number
  my_option_id: string | null
  options: PollOptionResult[]
}

export type CreatePollRequest = {
  title: string
  options: PollOptionInput[]
}

export type UpdatePollRequest = {
  title?: string
  status?: PollStatus
}

export type VotePollRequest = {
  option_id: string
}

export type PollVoteRecord = {
  user_id: string
  option_id: string
}

export type PollRecord = {
  id: string
  title: string
  status: PollStatus
  created_by: string
  created_at: string
  options: Array<{ id: string; title: string; description: string | null }>
  votes: PollVoteRecord[]
}
