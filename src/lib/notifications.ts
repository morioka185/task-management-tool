import { supabase } from './supabase'

export type NotificationType = 
  | 'task_assigned' 
  | 'task_completed' 
  | 'task_approved' 
  | 'task_rejected'
  | 'thread_reply'

interface CreateNotificationParams {
  userId: string
  taskId?: string
  type: NotificationType
  title: string
  message?: string
}

export const createNotification = async ({
  userId,
  taskId,
  type,
  title,
  message,
}: CreateNotificationParams) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        task_id: taskId,
        type,
        title,
        message,
      })

    if (error) throw error
  } catch (error) {
    console.error('通知作成エラー:', error)
  }
}

export const notifyTaskAssigned = async (taskId: string, assigneeId: string, taskTitle: string, assignerName: string) => {
  await createNotification({
    userId: assigneeId,
    taskId,
    type: 'task_assigned',
    title: '新しいタスクが割り当てられました',
    message: `${assignerName}さんから「${taskTitle}」が割り当てられました`,
  })
}

export const notifyTaskCompleted = async (taskId: string, assignerId: string, taskTitle: string, assigneeName: string) => {
  await createNotification({
    userId: assignerId,
    taskId,
    type: 'task_completed',
    title: 'タスクが完了しました',
    message: `${assigneeName}さんが「${taskTitle}」を完了しました（承認待ち）`,
  })
}

export const notifyTaskApproved = async (taskId: string, assigneeId: string, taskTitle: string) => {
  await createNotification({
    userId: assigneeId,
    taskId,
    type: 'task_approved',
    title: 'タスクが承認されました',
    message: `「${taskTitle}」が承認されました`,
  })
}

export const notifyTaskRejected = async (taskId: string, assigneeId: string, taskTitle: string, reason?: string) => {
  await createNotification({
    userId: assigneeId,
    taskId,
    type: 'task_rejected',
    title: 'タスクが差し戻されました',
    message: `「${taskTitle}」が差し戻されました${reason ? `：${reason}` : ''}`,
  })
}

export const notifyThreadReply = async (taskId: string, recipientId: string, taskTitle: string, senderName: string) => {
  await createNotification({
    userId: recipientId,
    taskId,
    type: 'thread_reply',
    title: '新しいメッセージがあります',
    message: `${senderName}さんから「${taskTitle}」に返信がありました`,
  })
}